import * as ws from "ws";
import * as http from "http";
import log from "../../services/logger";
import { Descriptor, SensorLogInbound, SensorOutbound } from "../sensor/sensor-model";
import { isDescriptorArrayValid } from "../sensor/sensor-data-validators";
import { DeviceData }  from "../device/device-status";
import { MonitoringClient, ExtWebSocket, MonitoringClients } from "./monitoring-client";

const moduleName = "monitoring-client.";
function label(name: string): string {
  return moduleName + name + ": ";
}
export interface InboundMessage {
    command: "authorization" | "startMonitor" | "stopMonitor";
    data?: any;
}
export interface OutboundMessage {
    command: "status" |  "log" |  "sensor" |"ping" | "authorize" | "authorized";
    data?: any;
}
let wss: ws.Server;

export function init (wwsServer: ws.Server) {
    const m = "init";
    wss = wwsServer;
    function noop() {
        const m = "noop";
        log.debug(label(m));
    }

    function heartbeat() {
        const m = "heartbeat";
        this.isAlive = true;
        log.debug(label(m));
    }
    // Ping each client
    const pingInterval = 30_000;
    const interval = setInterval(() => {
        wss.clients.forEach(function each(ws: ExtWebSocket) {
            if (ws.isAlive === false) return ws.terminate();
            ws.isAlive = false;
            ws.ping(noop);
    });
    }, pingInterval);
    wss.on("connection", (ws: ExtWebSocket, request: http.IncomingMessage): void  => {
        const m = "wss.on(connection)";
        log.info(label(m) + "new client connection, url=: " + ws.url + "headers= " + JSON.stringify(request.headers));

        ws.isAlive = true;
        sendAuthorizationRequest(ws);

        ws.on("pong", heartbeat);

        ws.on("message", (data: Buffer): void => {
            const m = "ws.on(message)";
            log.info(label(m) + "message=" + data.toString());
            parseInboundMessage(ws, data);
        });
        ws.on("error", (err: Error): void => {
            const m = "ws.on(error)";
            log.info(label(m) + err);
            ws.close();
        });
        ws.on("close", (code: number, reason: string): void => {
            const m = "ws.on(close)";
            const client: MonitoringClient = MonitoringClients.get(ws);
            if (!!client) {
                MonitoringClients.delete(ws);
                client.authenticated = false;
                log.info(label(m) + "connection closed, received (bytes): " + client.received + ", transmitted (bytes)" + client.transmitted);
            }
            ws.terminate();
            log.info(label(m) + "URL: " + ws.url + ", code: " + code +  ", reason: " + reason);
        });
    });
    wss.on("upgrade", function upgrade(request, ws, head) {
        const m = "wss.on(upgrade)";
        log.info(label(m) + "new client connection, url=: " + ws.url + "headers= " + JSON.stringify(request.headers));
        wss.handleUpgrade(request, ws, head, (ws: ExtWebSocket) => {
            wss.emit("connection", ws, request);
        });
    });
    wss.on("close", function close() {
        const m = "wss.on(close)";
        clearInterval(interval);
    });
}
export function readyState(state: number): string {
    switch (state) {
        case ws.CONNECTING:
            return "CONNECTING";
            case ws.OPEN:
                return "OPEN";
            case ws.CLOSING:
                return "CLOSING";
            case ws.CLOSED:
                return "CLOSED";
    }
    return "UNKNOWN";
}
function sendAuthorizationRequest(ws: ExtWebSocket) {
    const message = {command: "authorize", data: "Hello world from server"};
    ws.send(JSON.stringify(message));

}
export function sendSensorLog(tenantID: string, deviceID: string, data: SensorLogInbound) {
    const message: OutboundMessage = { command: "log", data};
    send(tenantID, deviceID, message);
}
export function sendSensor(tenantID: string, deviceID: string, data: SensorOutbound) {
    const message: OutboundMessage = { command: "sensor", data};
    send(tenantID, deviceID, message);
}
export function sendDeviceStatus(tenantID: string, deviceID: string, data: DeviceData) {
    const message: OutboundMessage = { command: "status", data};
    send(tenantID, deviceID, message);
}
function send(tenantID: string, deviceID: string, message: OutboundMessage) {
    const m = "send";
    MonitoringClients.forEach((client) => {
        if (client.tenantID === tenantID) {
            client.send(message);
            log.info(label(m)  + " sent to client");
        }
    });
}
function isObject(raw: unknown): boolean {
    return typeof raw === "object" && raw !== null;
}
function isValidInboundMessage(raw: unknown) {
    let valid = isObject(raw);
    if (valid) {
        const msg = raw as Partial<InboundMessage>;
        valid = valid
        && "command" in msg && typeof msg.command === "string"
        && (msg.command === "authorization" || msg.command === "startMonitor" || msg.command === "stopMonitor")
        && "data" in msg;
    }
    return valid;
}
function isValidToken(raw: unknown) {
    return typeof raw === "string";
}
export function parseInboundMessage(ws: ExtWebSocket, data: Buffer): void  {
    const m = "parseInboundMessage";
    try {
        const dataStr = data.toString();
        const raw = JSON.parse(dataStr);
        if (isValidInboundMessage(raw)) {
            const message = raw as InboundMessage;
            const client = MonitoringClients.get(ws);
            if (client && client.authenticated) {
                client.received += data.length;
                switch (message.command) {
                    case "authorization":
                        receiveAuthorizationCommand(client.ws, message?.data);
                        break;
                    case "startMonitor":
                        receiveStartMonitorCommand(client, message?.data);
                        break;
                    case "stopMonitor":
                        receiveStopMonitorCommand(client, message?.data);
                        break;
                }
            } else if (message.command === "authorization") {
                receiveAuthorizationCommand(ws, message?.data);
            } else {
                log.debug (label(m) + "WebSocket needs authorization");
                sendAuthorizationRequest(ws);
            }
        }
    }
    catch {
        log.debug(label(m) + "received invalid data=" + JSON.stringify(data));
    }
}
function receiveAuthorizationCommand(ws: ExtWebSocket, raw?: unknown) {
    if (!!raw && typeof raw === "string") {
        const authScheme = raw as string;
        const client = MonitoringClients.get(ws);
        if (!client) {
            MonitoringClient.createClient(ws, authScheme);
        } else {
            client.authorizeJWT(authScheme);
        }
    }
}
function receiveStartMonitorCommand(client: MonitoringClient, raw?: unknown) {
    if (raw && isDescriptorArrayValid(raw)) {
        const descs = raw as Descriptor[];
        startMonitor(client, descs);
    } else {
        startMonitor(client);
    }
}
function receiveStopMonitorCommand(client: MonitoringClient, raw?: unknown) {
    if (!!raw && isDescriptorArrayValid(raw)) {
        const desc = raw as Descriptor[];
        stopMonitor(client, desc);
    } else {
        stopMonitor(client);
    }
}
export function startMonitor(client: MonitoringClient, desc?: Descriptor[]) {
    const m = "startMonitor";
    log.info(label(m) + "device=" + JSON.stringify(desc));
    client.monitoring = true;
}
export function stopMonitor(client: MonitoringClient, desc?: Descriptor[]) {
    const m = "stopMonitor";
    log.info(label(m) + "device=" + JSON.stringify(desc));
    client.monitoring = false;
}

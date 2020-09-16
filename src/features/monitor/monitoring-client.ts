import * as ws from "ws";
import { authJWT, AuthJWTResponse } from "../auth/auth-jwt";
import log from "../../services/logger";

import { OutboundMessage } from "./monitor";

const moduleName = "monitoring-client.";
function label(name: string): string {
  return moduleName + name + ": ";
}
// This is a workaround since the @types does not define the isAlive property
export interface ExtWebSocket extends ws {
    isAlive: boolean;
}
export interface InboundMessage {
    command: "authorization" | "startMonitor" | "stopMonitor";
    data: any;
}
export class MonitoringClient {
    public authenticated = false;
    public tenantID = "";
    public sub = "";
    public transmitted = 0;
    public received = 0;
    public monitoring = false;

    constructor(public ws: ExtWebSocket) {
    }
    public authorizeJWT(authScheme: string) {
        const m = "authorizeJWT";
        authJWT(authScheme, (res: AuthJWTResponse) => {
            const payload = res?.locals;
            if (!!payload) {
                this.tenantID = payload.tenantID;
                this.sub = payload.sub;
                this.authenticated = true;
                MonitoringClients.set(this.ws, this);
                const authorized: OutboundMessage = {command : "authorized"};
                this.send(authorized);
                log.info (label(m) + "WebSocket authorization for tenantID=" + payload.tenantID);
            } else {
                MonitoringClients.delete(this.ws);
                this.ws.close(401, "Invalid token");
                this.ws.terminate();
            }
        });
    }
    public send(message: OutboundMessage) {
        const m = "send";
        const messageStr = JSON.stringify(message);
        if (this.ws.readyState === ws.OPEN) {
            try {
                this.ws.send(messageStr);
                this.transmitted += messageStr.length;
                log.debug(label(m) + "message sent to client");
            } catch (e) {
                log.error(label(m) + "Cannot send message, error=" + JSON.stringify(e));
            }
        }
    }
    public static createClient(ws: ExtWebSocket, authScheme: string) {
        const m = "createClient";
        const newClient = new MonitoringClient(ws);
        newClient.authorizeJWT(authScheme);
    }
}
export const MonitoringClients: Map<ExtWebSocket, MonitoringClient> = new Map();

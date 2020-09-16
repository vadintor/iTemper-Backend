import { isValidObjectId } from "mongoose";

export interface MemoryUsage {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
}

export interface UserInfo {
    username: string;
    uid: number;
    gid: number;
    shell: any;
    homedir: string;
}
export interface NetworkInterfaceInfo {
    address: string;
    netmask: string;
    family: string;
    mac: string;
    internal: boolean;
}
export interface CpuUsage {
    user: number;
    system: number;
}
export interface DeviceData {
    timestamp: number;
    hostname: string;
    loadavg: number[];
    uptime: number;
    freemem: number;
    totalmem: number;
    release: string;
    networkInterfaces: { [index: string]: NetworkInterfaceInfo[] };
    userInfo: UserInfo;
    memoryUsage: MemoryUsage;
    cpuUsage: CpuUsage;
    pid: number;
}

export function isStatusValid(data: Partial<DeviceData>): boolean {
    if (data.timestamp && data.hostname && data.loadavg && data.uptime &&
    data.freemem && data.totalmem && data.networkInterfaces && data.userInfo &&
    data.memoryUsage && data.cpuUsage && data.pid)
        return true;
    else
        return false;
}
export function formatDeviceData (data: DeviceData): string {
    let report: string = "";
    report += "time: " + data.timestamp.toLocaleString();
    report += ", hostname" + data.hostname;
    report += ", uptime" + data.uptime;
    report += ", networkInterfaces" + JSON.stringify(data.networkInterfaces);
    return report;
}
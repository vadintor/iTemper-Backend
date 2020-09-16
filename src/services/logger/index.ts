import { LOG_LEVEL } from "./../config";
import { createLogger, format, transports, Logger } from "winston";
import util from "util";

const { colorize, combine, timestamp, printf, label} = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${level}: ${timestamp} [${label}]: ${message}`;
});


export class Log {
  private static logger: Logger;

  private static transports = {
    file: new transports.File({ filename: "itemper-error.log", level: "error" }),
    console: new (transports.Console)(),
  };
  private static applicationName = "iTemper-backend";
  private label: string;
  private _name: string;

  constructor(name: string = "") {

    if (name.length > 0) {
      this.label = Log.applicationName + "-" + name;
    } else {
      this.label = Log.applicationName;
    }
    this._name = name;

    Log.logger =  createLogger ({
      format: combine (colorize(), timestamp(), label ({ label: this.label}), myFormat),
      exitOnError: false,
      level: LOG_LEVEL,
      transports: [
        Log.transports.file,
        Log.transports.console,
      ],
    });
  }
    private time(): string {
      return new Date().toISOString();
    }
    public name(): string {
      return this._name;
    }
    public info (str: string, ...args: any[]) {
      Log.logger.info(this.message(str, ...args));
    }
    public debug (str: string, ...args: any[]) {
      Log.logger.debug(this.message(str, ...args));
    }
    public error (str: string, ...args: any[]) {
      Log.logger.error(this.message(str, ...args));
    }
    public setLevel(level: string): void {
      Log.logger.transports[1].level = level;
    }
    private message (str: string, ...args: any[]) {
      const report = util.format(str, ...args);
      return this.appendTenant(report);
    }
    private appendTenant(report: string ): string {
      return report;
    }
}
const log = () => new Log();
export default log();

export function setLevel(level: string): void {
    log().setLevel(level);
}


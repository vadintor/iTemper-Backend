import chalk from "chalk";

export const JWT_SECRET = getEnv("JWT_SECRET", true);

export const SALT = getEnv("SALT", true);

export const LOG_LEVEL = getEnv("LOG_LEVEL");

export const PORT = getEnv("PORT");

export const PRODUCTION = getEnv("NODE_ENV") === "production";

export const EXCLUDE = getEnv("EXCLUDE") === "routes";

const MONGODB_URI = getEnv("MONGODB_URI");

const MONGODB_PORT = getEnv("MONGODB_PORT");



function getEnv(env: string, redact: boolean = false): string {
    const val = process.env[env];
    if (!val) {

        const msg = "console.error: [itemper-backend]: config: No " + env + " environment variable.";
        console.error(chalk.red(msg));
        process.exit(0);
    }
    const redacted = redact ? "********* (redacted)" : val;
    const msg = "console.info: [itemper-backend]: config: " + env + " = " + redacted;
    console.info(chalk.green(msg));
    return val;
}
let userDBConnectionStr: string = MONGODB_URI  + ":" + parseInt(MONGODB_PORT);

export function setUserDBConnectionString(connectionString: string) {
    const msg = "console.info: [itemper-backend]: config.setUserDBConnectionString: " + connectionString;
    console.info(chalk.green(msg));
    userDBConnectionStr = connectionString;
}

export function userDBConnectionString(): Promise<string> {
    return new Promise (resolve => {
        const connectionString = userDBConnectionStr + "/Directory";
        const msg = "console.info: [itemper-backend]: config.userDBConnectionString: " + connectionString;
        console.info(chalk.green(msg));
        resolve(connectionString);
    });
}

export function tenantDBConnectionString(tenantID: string): Promise<string> {
    return new Promise (resolve => {
        const connectionString = userDBConnectionStr + "/" + tenantID;
        const msg = "console.info: config.tenantDBConnectionString: " + connectionString;
        console.info(chalk.green(msg));
        resolve( connectionString);
    });
}

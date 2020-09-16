import mongoose from "mongoose";
import log from "../../services/logger";
// import { tenantDBConnectionString } from "../../services/config";
const moduleName = "tenant-database.";
function label(name: string): string {
  return moduleName + name + ": ";
}
let getConnectionString: (tenantID: String) => Promise<string>;

const TenantConnections = new Map();

export function initialize (ConnectionStringFactory: (tenantID: String) => Promise<string>) {
  getConnectionString = ConnectionStringFactory;
}

export function useDB(tenantID: string, callback: (err: Error, connection: mongoose.Connection) =>  void ): void {
  const m = "useDB";

  if (TenantConnections.has(tenantID)) {
    log.debug (label(m) + "reusing connection for tenantID=" + tenantID);
    callback(undefined, TenantConnections.get(tenantID));
  } else {

    getConnectionString(tenantID).then(connectionURI => {
      log.debug(label(m) + "connectionURI=" + connectionURI);
      const connection: mongoose.Connection = mongoose.createConnection(connectionURI,
        {  useNewUrlParser: true,  useUnifiedTopology: true, useCreateIndex: true });

      connection.on("error", (): void =>  {
        log.error (label(m) + "connection error, check that the db is running - " + connectionURI);
        callback(new Error(), undefined);
      });

      connection.on("connected", (): void =>  {
        log.info (label(m) + "connected to " + connectionURI);
        TenantConnections.set(tenantID, connection);
        callback(undefined, connection);
      });
    });


  }
}



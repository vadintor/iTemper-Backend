import { NextFunction, Request, Response } from "express";
import log from "../../services/logger";
import * as database from "./tenant-database";
import { Connection } from "mongoose";


// assume the requests has been authorized and a tenantID assigned
export function useTenantDB(req: Request, res: Response, next: NextFunction) {
    log.debug("tenant-middleware.useTenantDB: res.locals.tenantID=" + JSON.stringify(res.locals.tenantID));
    const tenantID = res.locals.tenantID;

    if (!tenantID) next(new Error());

    database.useDB(tenantID, (err: Error, connection: Connection) => {
        if (err) {
            log.error("tenant-middleware: Error when connecting to tenant DB " + tenantID);
            next(err);
        }
        if (connection) {
            log.info("tenant-middleware: connected to tenant DB " + tenantID);
            res.locals.connection = connection;
            next();
        } else {
            log.error("tenant-middleware: could not connect to tenant DB " + tenantID);
            next(new Error());
        }
    });
}
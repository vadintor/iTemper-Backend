import log from "../../services/logger";
import * as util from "../../services/util";

import { NextFunction, Request, Response } from "express";
import { Connection, Model } from "mongoose";

import { authorizeJWT, authorizeAPIKey } from "./../auth/auth-middleware";
import { useTenantDB } from "./../tenant/tenant-middleware";
import { tenantModel } from "./../tenant/tenant-model";
import { SensorDocument, SensorSchema } from "./sensor-model";
import { SensorLogDocument, SensorLogSchema } from "./sensor-model";

const moduleName = "sensor-middleware.";
function label(name: string): string {
  return moduleName + name + ": ";
}

// Pre-req: requests has been authorized and tenantID assigned
export function useSensorModels(req: Request, res: Response, next: NextFunction) {
    const m = "useSensorModels";
    const connection: Connection = res.locals.connection;
    const tenantID = res.locals.tenantID;

    if (!connection) next(new Error("No DB Connection"));
    if (!tenantID) next(new Error("No tenantId"));

    const SensorModel: Model<SensorDocument> = tenantModel("Sensor", SensorSchema, tenantID, connection);
    const SensorLogModel: Model<SensorLogDocument> = tenantModel("SensorLog", SensorLogSchema, tenantID, connection);

    res.locals.Sensor = SensorModel;
    res.locals.SensorLog = SensorLogModel;
    next();
}

export const SensorDeviceMiddleWare = [authorizeAPIKey, useTenantDB, useSensorModels];
export const SensorUserMiddleWare = [authorizeJWT, useTenantDB, useSensorModels];
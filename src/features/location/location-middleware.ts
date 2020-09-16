import log from "../../services/logger";
import * as util from "../../services/util";

import multer from "multer";

import { NextFunction, Request, Response } from "express";

import { Connection, Model } from "mongoose";

import { authorizeJWT } from "./../auth/auth-middleware";
import { useTenantDB } from "./../tenant/tenant-middleware";
import { tenantModel } from "./../tenant/tenant-model";
import { useSensorModels } from "./../sensor/sensor-middleware";
import { LocationDocument, LocationSchema } from "./location-model";

const moduleName = "location-middleware.";
function label(name: string): string {
  return moduleName + name + ": ";
}
const limits =  {
    fileSize: 2_000_000,
    files: 1,
};
const uploads = multer({ dest: "uploads/", limits });

function useLocationModel(req: Request, res: Response, next: NextFunction) {
    const m = "useLocationModel, " + res.locals.tenantID;

    log.debug(label(m) + " dbName=" + res.locals.connection.db.dbName);
    const connection: Connection = res.locals.connection;
    const tenantID = res.locals.tenantID;

    if (!connection) next(new Error());

    const LocationModel: Model<LocationDocument> = tenantModel("Location", LocationSchema, tenantID, connection);
    res.locals.Location = LocationModel;

    log.debug(label(m) + "res.locals.Sensor=" + util.stringify(res.locals.Sensor));

    next();
}
const uploadLocationImage = uploads.single("locationImage");

function useUpload (req: Request, res: Response, next: NextFunction)  {
  const m = "useUpload, tenantID=" + res.locals.tenantID;
  log.debug(label(m));
  uploadLocationImage(req, res, (err: any) => {
    const m = "uploadLocationImage, tenantID=" + res.locals.tenantID;
    if (err) {
      log.error(label(m) + "error=" + util.stringify(err));
      next(err);
    } else {
      log.debug(label(m) + "upload file=" + JSON.stringify(req.file));
      next();
    }
  });
}

export const LocationMiddleWare = [authorizeJWT,
                                  useTenantDB,
                                  useLocationModel,
                                  useSensorModels];

export const LocationUploadMiddleWare = [authorizeJWT,
                                  useTenantDB,
                                  useLocationModel,
                                  useSensorModels,
                                  useUpload,
                                  ];

import { NextFunction, Request, Response } from "express";

import log from "../../services/logger";

import { Device, DeviceDocument } from "./../device/device-model";
import { authJWT, AuthJWTResponse } from "./auth-jwt";
const moduleName = "auth-middleware.";
function label(name: string): string {
  return moduleName + name + ": ";
}
export function authorizeJWT(req: Request, res: Response, next: NextFunction) {
  const m = "authorizeJWT";
  const AUTH_HEADER = "authorization";
  const reqHeader = req.headers[AUTH_HEADER];
  if (reqHeader) {
    authJWT(reqHeader, (authRes: AuthJWTResponse) => {
      if (authRes.error) {
        res.status(401).send(authRes.error);
      } else {
        res.locals.tenantID = authRes.locals.tenantID.slice();
        res.locals.sub = authRes.locals.sub.slice();
        next();
      }
    });
  } else {
    log.debug (label(m) + "Authentication header missing, req.headers=" + JSON.stringify(req.headers));
    res.status(401).send({error: "No authentication information provided"});
  }

}

export function authorizeAPIKey(req: Request, res: Response, next: NextFunction) {
  const m = "authorizeDevice";

  const AUTH_HEADER = "Authorization";
  const BEARER_AUTH_SCHEME = "bearer";
  const reqHeader = req.get(AUTH_HEADER);
  if (reqHeader) {
    const matches = reqHeader.split (" ");
    if (matches.length == 2 ) {

      const headerValues = { scheme: matches[0], token: matches[1] };

      if (headerValues.scheme.toLowerCase() === BEARER_AUTH_SCHEME) {
        const SEPARATOR = ":";
        const token = headerValues.token.split(SEPARATOR);
        const deviceID = token[0];
        const key = token[1];

        Device.findOne({ deviceID }, (err: any, device: DeviceDocument) => {
          if (err ) { return next(err); }
          if (device) {
            device.comparePassword(key, (err: Error, isMatch: boolean) => {
              if (err) {
                log.error(label(m) + "error=" + err);
              }
              if (isMatch) {
                log.info(label(m) + "Access authorized for DeviceID=" + device.deviceID + ", tenantID=" + device.tenantID);
                res.locals.tenantID = device.tenantID;
                res.locals.deviceID = device.deviceID;
                res.locals.deviceName = device.name;
                next();
              } else {
                log.info (label(m) + "Access DENIED for deviceID=" + deviceID + ", tenantID=" + device.tenantID);
                res.status(401).send("Invalid shared access key");
              }
            });
          } else {
            log.debug (label(m) + "Device not found, deviceID=" + deviceID);
            res.status(401).send("Device not found");
          }
        });
      } else {
        log.debug (label(m) + "header Authorization bearer expected");
        res.status(400).send("Erroneous authorization header value, expected Authorization bearer <token> but got " + reqHeader);
      }
    } else {
      log.debug (label(m) + "header Authorization bearer expected");
      res.status(400).send("Invalid authorization header, expected Authorization bearer <token> but got " + reqHeader);
    }
  } else {
    log.debug (label(m) + "Authentication header missing, req.headers=" + JSON.stringify(req.headers));
    res.status(400).send("No authentication information provided");
  }
}

import cors from "cors";
import { Application, NextFunction, Request, Response, static as staticFiles } from "express";
import compression from "compression";  // compresses requests

import bodyParser from "body-parser";
import lusca from "lusca";

import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import path from "path";

// Controllers (route handlers)
import * as homeController from "./features/home/home-controller";
import * as userController from "./features/user/user-controller";
import * as sensorController from "./features/sensor/sensor-controller";
import * as deviceController from "./features/device/device-controller";
import * as locationController from "./features/location/location-controller";
import * as adminController from "./features/admin/admin-controller";

import log from "./services/logger";
import { stringify } from "./services/util";
import errorHandler from "errorhandler";

// Middleware
import { authorizeJWT } from "./features/auth/auth-middleware";
import { SensorDeviceMiddleWare, SensorUserMiddleWare } from  "./features/sensor/sensor-middleware";
import { DeviceDataMiddleWare, DeviceMiddleWare } from  "./features/device/device-middleware";
import { LocationMiddleWare, LocationUploadMiddleWare } from "./features/location/location-middleware";

import * as WebSocket from "ws";

import * as monitor from "./features/monitor/monitor";
export function initApp(wss: WebSocket.Server, app: Application) {

  monitor.init(wss);

  app.use(errorHandler());
  const corsOptions = {
    origin: [
      "https://itemper.io",
      "https://www.itemper.io",
      "https://api.itemper.io",
      "http://localhost:8080",
      "https://localhost:8080"
    ],
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "PUT", "POST", "OPTIONS", "DELETE"],
    credentials: true,
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  };
  app.use(cors(corsOptions));
  app.options("*", cors());
  // app.options("*", cors()); // include before other routes

  // Common configuration
  app.use(compression());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.disable("x-powered-by");
  app.use(lusca.xframe("SAMEORIGIN"));
  app.use(lusca.xssProtection(true));
  app.use(lusca.nosniff());
  app.set("trust proxy", "loopback, uniquelocal");

  const locationImageFolder = path.join(process.cwd(), "uploads");
  app.use("/uploads", staticFiles(locationImageFolder, { maxAge: 31557600000 }));
  log.info("app.ts locationImageFolder=" + locationImageFolder);

  app.use((req: Request, res: Response, next: NextFunction) => {
    log.info("");
    log.info("------------------ " +  req.method + " " + req.path + " ------------------------------");
    log.info("headers: " + JSON.stringify(req.headers, undefined, 2));
    log.info("body:    " + JSON.stringify(req.body, undefined, 2));
    log.info("params:  " + JSON.stringify(req.params, undefined, 2));
    log.info("query:   " + JSON.stringify(req.query, undefined, 2));
    log.info("res.locals.tenantID: " + stringify(res.locals.tenantID));
    next();
  });

  // -------------- / & /public ----------------------------------
  app.use(staticFiles(path.join(__dirname, "public"), { maxAge: 31557600000 }));

  // --------------------------------------------------------------
  // Routes with file uploads or forms
  // --------------------------------------------------------------

  // -------------- /Wooecommerce webhooks ------------------------
  app.get("/sales", sensorController.notImplemented);
  app.post("/sales", sensorController.notImplemented);
  app.put("/sales", sensorController.notImplemented);
  app.delete("/sales", sensorController.notImplemented);

  // -------------- /Stripe webhooks -----------------------------
  app.get("/payment", sensorController.notImplemented);
  app.post("/payment", sensorController.notImplemented);
  app.put("/payment", sensorController.notImplemented);
  app.delete("/payment", sensorController.notImplemented);

  // -------------- /locations ----------------------------------
  app.post("/locations/", LocationUploadMiddleWare, locationController.createLocationFieldValidator, locationController.postCreateLocation);
  app.put("/locations/:locationID/file", LocationUploadMiddleWare, locationController.putFile);

  // application/json after this point

  app.use((req: Request, res: Response, next: NextFunction) => {
      res.set("Connection", "close");
      if (req.headers["content-type"] && req.headers["content-type"].toLowerCase() !== "application/json") {
        res.status(415).send("Unsupported media type, wrong content-type");
      } else {
        next();
      }
  });

  app.get("/locations/", LocationMiddleWare, locationController.getAllLocations);
  app.put("/locations/:locationID/name", LocationMiddleWare, locationController.updateNameFieldValidator , locationController.putName);
  app.put("/locations/:locationID/color", LocationMiddleWare, locationController.updateColorFieldValidator, locationController.putColor);
  app.put("/locations/:locationID/sensors", LocationMiddleWare, locationController.updateSensorsFieldValidator, locationController.putSensors);
  app.delete("/locations/:locationID", LocationMiddleWare, locationController.LocationIDFieldValidator, locationController.deleteLocation);

  // -------------- /users ----------------------------------

  app.post("/signup", userController.PostValidator, userController.postSignup);
  app.post("/login", userController.PostValidator, userController.postLogin);
  app.post("/logout", authorizeJWT, userController.postLogout);

  // Requires JWT Token //
  // Tenant methods
  app.post("/users/add", authorizeJWT, userController.PostValidator, userController.postSignup);

  app.delete("/users/delete", authorizeJWT, userController.DeleteValidator, userController.deleteUser);

  // -------------- /devices ----------------------------------
  // // Requires JWT Token //
  // Create a device, returns a shared API key (the key is not saved, so remember)
  app.post("/devices/", DeviceMiddleWare, deviceController.RegisterDeviceValidator, deviceController.postRegisterDevice);

  // Get all devices
  app.get("/devices", DeviceMiddleWare, deviceController.NoNameFieldValidator, deviceController.getAllDevices);

  // Update device name
  app.put("/devices/:deviceID", DeviceMiddleWare,  deviceController.RenameFieldValidator, deviceController.putDeviceName);

   // Update device color
   app.put("/devices/:deviceID", DeviceMiddleWare,  deviceController.UpdateColorFieldValidator, deviceController.putDeviceColor);

  // Get device with deviceID
  app.get("/devices/:deviceID", DeviceMiddleWare, deviceController.DeviceIDFieldValidator, deviceController.getDevice);

  // Delete deviceID
  app.delete("/devices/:deviceID", DeviceMiddleWare, deviceController.DeviceIDFieldValidator, deviceController.deleteDevice);

  // -------------- /device ----------------------------------
  // Require Shared API Key //
  // Update device data
  app.post("/device/status", DeviceDataMiddleWare,  deviceController.DeviceDataFieldValidator, deviceController.postDeviceData);
  app.post("/device/status", DeviceDataMiddleWare,  deviceController.DeviceDataFieldValidator, deviceController.postDeviceData);

  // -------------- /sensors ----------------------------------
  // Require Shared API Key //
  // Create a sensor
  app.post("/sensors", SensorDeviceMiddleWare, sensorController.postValidator, sensorController.postSensors);

  // Post sensor data
  app.post("/sensors/:sn/:port", SensorDeviceMiddleWare, sensorController.postDataValidator, sensorController.postSensorLog);


  // // Requires JWT Token //
  // Get sensors
  app.get("/sensors", SensorUserMiddleWare, sensorController.getSensors);

  // delete  sensors
  app.post("/sensors/:sn/delete",  SensorUserMiddleWare, sensorController.deleteValidator, sensorController.postDeleteSensors);

  // delete  sensors
  app.post("/sensors/:sn/:port/delete",  SensorUserMiddleWare, sensorController.deleteValidator, sensorController.postDeleteSensors);

  app.put("/admin",  authorizeJWT, adminController.logLevelFieldValidator, adminController.putLogLevel);

}

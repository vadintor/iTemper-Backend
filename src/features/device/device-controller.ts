"use strict";
import log from "../../services/logger";
import * as crypto from "../../services/crypto";

import { Response, Request } from "express";
import { CustomValidator, body, param, validationResult, ValidationChain } from "express-validator";
import { DeviceModel } from "./device-model";
import { isStatusValid, DeviceData, formatDeviceData } from "./device-status";
import { sendDeviceStatus } from "../../features/monitor/monitor";

const moduleName = "device-controller.";
function label(name: string): string {
  return moduleName + name + ": ";
}


const DeviceIDValidator: ValidationChain = param ("deviceID").exists().isUUID(4);
const DeviceNameRegExp = /^[0-9A-Z]+[\-0-9A-Z]+[0-9A-Z]$/i;
const NameValidator: ValidationChain = body ("name", "Device name is not valid, must be alphanumeric 4-32 characters")
  .exists().trim().isLength({min: 4, max: 32}).matches(DeviceNameRegExp);
const NoNameValidator: ValidationChain = param ("name").not().exists();
const DeviceDataValidator: ValidationChain = body("data", "Device data not valid").exists().custom((data) => isStatusValid(data));
export const DeviceIDFieldValidator = [DeviceIDValidator];
const ColorValidator: ValidationChain = body("color", "Invalid device color").exists().isHexColor();

export const DeviceDataFieldValidator = [DeviceDataValidator];
export const NameFieldValidator = [ NameValidator ];
export const NoNameFieldValidator = [NoNameValidator];
export const RegisterDeviceValidator = [NameValidator, ColorValidator];
export const RenameFieldValidator = [DeviceIDValidator, NameValidator];
export const UpdateColorFieldValidator = [DeviceIDValidator, ColorValidator];

// -------------------------- postRegisterDevice -------------------------
export let postRegisterDevice = (req: Request, res: Response): void => {
    const m = "postRegisterDevice, tenantID=" + res.locals.tenantID;
    const Device: DeviceModel = res.locals.Device;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
       res.status(422).json({ errors: errors.mapped() });
       return;
    }

    const name = req.body.name;
    const color = req.body.color;

    Device.findOne({name: name}).then(device => {
      if (device === null) {
        log.debug(label(m) + "Register device " + name);
        // Device does not exist, let's create one
        const deviceID = crypto.uuid();
        const secrete = crypto.uuid();

        const newDevice = new Device();
        newDevice.set("name", name);
        newDevice.set("color", color);
        newDevice.set("key", secrete); // will be hashed when the device is saved below.
        newDevice.set("deviceID", deviceID);
        newDevice.set("tenantID", res.locals.tenantID);

        const body = {
          name: newDevice.name,
          color: newDevice.color,
          deviceID: newDevice.deviceID,
          key: newDevice.deviceID + ":" + secrete};
        newDevice.save()
        .then(() => {
          log.info(label(m) + "Registered device=" + JSON.stringify(body));
          res.status(200).send(body);
        })
        .catch(() => {
          log.error(label(m) + "Error saving device " + name);
          res.status(404).send("Cannot save device " + name);
        });

      } else {
          log.debug(label(m) + "A device with that name already exists");
          res.status(404).send("Device " + name + " exists already");
      }
    });
  };
// -------------------------- putDeviceName -------------------------
export let putDeviceName = (req: Request, res: Response): void => {
  const m = "putDeviceName, tenantID=" + res.locals.tenantID;
  const Device: DeviceModel = res.locals.Device;
  const tenantID = res.locals.tenantID;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
     res.status(422).json({ errors: errors.mapped() });
     return;
  }
  const deviceID = req.params.deviceID;
  const name = req.body.name;
  const filter = { deviceID: deviceID, tenantID: tenantID };
  const update = { name: name };
  const option = { new: true };
  Device.findOneAndUpdate(filter, update, option).then(device => {
      if (device) {
        const body = {
          name: device.name,
          color: device.color,
          deviceID: device.deviceID,
          key: device.deviceID + ":" + device.key,
          uptime: device.uptime,
          statusTime: device.statusTime,
        };
        const bodyStr = JSON.stringify(body);
        log.info(label(m) + "Renamed device with deviceID=" + deviceID + " to " + name + "for tenantID=" + res.locals.tenantID);
        res.status(200).send(body);
      }
      else {
        log.error(label(m) + "Error renaming deviceID=" + deviceID + " for tenantID=" + res.locals.tenantID);
        res.status(404).send("Cannot rename device=" + name);
      }
    }).catch(err => {
      log.info(label(m) + "The device does not exist for tenantID=" + res.locals.tenantID);
      res.status(400).send("Cannot rename device");
  });
};
// -------------------------- putDeviceColor -------------------------
export let putDeviceColor = (req: Request, res: Response): void => {
  const m = "putDeviceColor, tenantID=" + res.locals.tenantID;
  const Device: DeviceModel = res.locals.Device;
  const tenantID = res.locals.tenantID;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
     res.status(422).json({ errors: errors.mapped() });
     return;
  }
  const deviceID = req.params.deviceID;
  const color = req.body.color;
  const filter = { deviceID: deviceID, tenantID: tenantID };
  const update = { color };
  const option = { new: true };
  Device.findOneAndUpdate(filter, update, option).then(device => {
      if (device) {
        const body = {name, color, deviceID, key: device.deviceID + ":" + device.key};
        const bodyStr = JSON.stringify(body);
        log.info(label(m) + "Renamed device with deviceID=" + deviceID + " to " + name + "for tenantID=" + res.locals.tenantID);
        res.status(200).send(body);
      }
      else {
        log.error(label(m) + "Error renaming deviceID=" + deviceID + " for tenantID=" + res.locals.tenantID);
        res.status(404).send("Cannot rename device=" + name);
      }
    }).catch(err => {
      log.info(label(m) + "The device does not exist for tenantID=" + res.locals.tenantID);
      res.status(400).send("Cannot rename device");
  });
};
// -------------------------- postDeviceData -------------------------
export let postDeviceData = (req: Request, res: Response): void => {
  const statusTime = Date.now();
  const m = "postDeviceData, tenantID=" + res.locals.tenantID;
  const Device: DeviceModel = res.locals.Device;
  const tenantID = res.locals.tenantID;
  const deviceID = res.locals.deviceID;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
     res.status(422).json({ errors: errors.mapped() });
     return;
  }
  const status = req.body.data as DeviceData;
  const uptime = status.uptime;
  const filter = { deviceID: deviceID, tenantID: tenantID };
  const update = { statusTime,  uptime};
  const option = { new: true };
  Device.findOneAndUpdate(filter, update, option).then(device => {
    const report = formatDeviceData(status);
      if (device) {
        const body = { sync: statusTime - status.timestamp };
        log.info(label(m) + "Status report, deviceID=" + deviceID + " : " + report + "for tenantID=" + res.locals.tenantID);
        sendDeviceStatus(tenantID, deviceID, status);
        res.status(200).send(body);
      }
      else {
        log.info(label(m) + "Error saving status report, deviceID=" + deviceID + " not found for tenantID=" + res.locals.tenantID);
        res.status(404).send("Cannot save status report");
      }
    }).catch(err => {
      log.error(label(m) + "The device does not exist for tenantID=" + res.locals.tenantID + ", err=" + err);
      res.status(400).send("Cannot save device status report");
  });
};

type GetDeviceTokenBody = {deviceID: string, shared_access_key: string};

// -------------------------- getAllDevices -------------------------
export let getAllDevices = (req: Request, res: Response): void => {
  const m = "getAllDevices, tenantID=" + res.locals.tenantID;
  const Device: DeviceModel = res.locals.Device;
  const tenantID = res.locals.tenantID;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
     res.status(422).json({ errors: errors.mapped() });
     return;
  }
  const filter = { tenantID: tenantID };
  Device.find(filter)
  .then(devices => {
    const body: any = [];
    devices.forEach(device => {
      body.push({
        name: device.name,
        color: device.color,
        deviceID: device.deviceID,
        key: device.deviceID + ":" + device.key,
        uptime: device.uptime,
        statusTime: device.statusTime,
      });
    });
    log.info(label(m) + "get #devices" + devices.length);
    res.status(200).send(body); })
  .catch((err) => res.status(404).end());
};

// -------------------------- getDevice -------------------------
export let getDevice = (req: Request, res: Response): void => {
  const m = "getDevice, tenantID=" + res.locals.tenantID;
  const Device: DeviceModel = res.locals.Device;
  const tenantID = res.locals.tenantID;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
     res.status(422).json({ errors: errors.mapped() });
     return;
  }
  const deviceID = req.params.deviceID;
  const filter = { deviceID: deviceID, tenantID: tenantID };
  Device.findOne(filter)
  .then(device => {
    log.info(label(m) + "get deviceID=" + device.deviceID + "for tenantID=" + device.tenantID);
    const body = {
      name: device.name,
      color: device.color,
      deviceID: device.deviceID,
      key: device.deviceID + ":" + device.key,
      uptime: device.uptime,
      statusTime: device.statusTime,
    };
    res.status(200).send(JSON.stringify(body)); })
  .catch((err) => res.status(404).send(err));
};

// -------------------------- deleteDevice -------------------------
export let deleteDevice = (req: Request, res: Response): void => {
  const m = "deleteDevice";
  const Device: DeviceModel = res.locals.Device;
  const tenantID = res.locals.tenantID;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
     res.status(422).json({ errors: errors.mapped() });
     return;
  }
  const deviceID = req.params.deviceID;
  const filter = { deviceID: deviceID, tenantID: tenantID };
  Device.findOneAndRemove(filter).then(device => {
    if (device) {
      log.info(label(m) + "Deleted deviceID=" + device.deviceID + "for tenantID=" + res.locals.tenantID);
      const body = {name: device.name, deviceID: device.deviceID};
      res.status(200).send(body);
    } else {
      log.debug(label(m) + "The device does not exist for tenantID=" + res.locals.tenantID);
      res.status(404).send("Device id=" + deviceID + " does not exist");
    }
  });
};
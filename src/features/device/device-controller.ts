"use strict";
import log from "../../services/logger";
import * as crypto from "../../services/crypto";

import { Response, Request } from "express";
import { body, param, validationResult, ValidationChain } from "express-validator/check";
import { DeviceModel } from "./device-model";

const moduleName = "device-controller.";
function label(name: string): string {
  return moduleName + name + ": ";
}


const NameValidator: ValidationChain = body ("name", "Device name is not valid, must be alphanumeric 4-32 characters").exists().trim().isAlphanumeric().isLength({min: 4, max: 32});
const NoNameValidator: ValidationChain = param ("name").not().exists();
const DeviceIDValidator: ValidationChain = param ("deviceID").exists().isUUID(4);

export const NameFieldValidator = [ NameValidator ];
export const NoNameFieldValidator = [NoNameValidator];
export const DeviceIDFieldValidator = [DeviceIDValidator];
export const RenameFieldValidator = [DeviceIDValidator, NameValidator];

export let postRegisterDevice = (req: Request, res: Response): void => {
    const m = "postRegisterDevice, tenantID=" + res.locals.tenantID;
    const Device: DeviceModel = res.locals.Device;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
       res.status(422).json({ errors: errors.mapped() });
       return;
    }

    const name = req.body.name;

    Device.findOne({name: name}).then(device => {
      if (device === null) {
        log.debug(label(m) + "Register device " + name);
        // Device does not exist, let's create one
        const deviceID = crypto.uuid();
        const secrete = crypto.uuid();

        const newDevice = new Device();
        newDevice.set("name", name);
        newDevice.set("key", secrete); // will be hashed when the device is saved below.
        newDevice.set("deviceID", deviceID);
        newDevice.set("tenantID", res.locals.tenantID);

        const body = {name: newDevice.name, deviceID: newDevice.deviceID, key: newDevice.deviceID + ":" + secrete};
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

export let putDeviceName = (req: Request, res: Response): void => {
  const m = "putDeviceName";
  const Device: DeviceModel = res.locals.Device;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
     res.status(422).json({ errors: errors.mapped() });
     return;
  }
  const deviceID = req.params.deviceID;
  const name = req.body.name;
  const filter = { deviceID: deviceID };
  const update = { name: name };
  const option = { new: true };
  Device.findOneAndUpdate(filter, update, option).then(device => {
      if (device) {
        const body = {name, deviceID, key: device.deviceID + ":" + device.key};
        const bodyStr = JSON.stringify(body);
        log.info(label(m) + "Renamed device with deviceID=" + deviceID + " to " + name + "for tenantID=" + res.locals.tenantID);
        res.status(200).send(body);
      }
      else {
        log.error(label(m) + "Error renaming deviceID=" + deviceID + " for tenantID=" + res.locals.tenantID);
        res.status(404).send("Cannot rename device=" + name);
      }
    }).catch(err => {
      log.info; (label(m) + "The device does not exist for tenantID=" + res.locals.tenantID);
      res.status(404).send("Cannot rename device");
    });
  };

type GetDeviceTokenBody = {deviceID: string, shared_access_key: string};

export let getAllDevices = (req: Request, res: Response): void => {
  const m = "getAllDevices";
  const Device: DeviceModel = res.locals.Device;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
     res.status(422).json({ errors: errors.mapped() });
     return;
  }
  Device.find({})
  .then(devices => {
    const body: any = [];
    // Loop through all devices and assign new JWT
    devices.forEach(device => {
      body.push({name: device.name, deviceID: device.deviceID, key: device.deviceID + ":" + device.key});
    });
    log.info(label(m) + "get #devices" + devices.length);
    res.status(200).send(JSON.stringify(body)); })
  .catch((err) => res.status(404).end());
};

export let getDevice = (req: Request, res: Response): void => {
  const m = "getDevice";
  const Device: DeviceModel = res.locals.Device;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
     res.status(422).json({ errors: errors.mapped() });
     return;
  }
  const deviceID = req.params.deviceID;

  Device.findOne({deviceID: deviceID})
  .then(device => {
    log.info(label(m) + "get deviceID=" + device.deviceID + "for tenantID=" + device.tenantID);
    const body: any = {name: device.name, deviceID: device.deviceID};
    // Loop through all devices and assign new JWT
    res.status(200).send(JSON.stringify(body)); })
  .catch((err) => res.status(404).send(err));
};

export let deleteDevice = (req: Request, res: Response): void => {
  const m = "deleteDevice";
  const Device: DeviceModel = res.locals.Device;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
     res.status(422).json({ errors: errors.mapped() });
     return;
  }
  const deviceID = req.params.deviceID;

  Device.findOneAndRemove({deviceID: deviceID}).then(device => {
    if (device) {
      log.info(label(m) + "Deleted deviceID=" + device.deviceID + "for tenantID=" + res.locals.tenantID);
      const body = JSON.stringify({name: device.name, deviceID: device.deviceID});
      res.status(200).send(body);
    } else {
      log.debug(label(m) + "The device does not exist for tenantID=" + res.locals.tenantID);
      res.status(404).send("Device id=" + deviceID + " does not exist");
    }
  });
};
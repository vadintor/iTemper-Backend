"use strict";
import log from "../../services/logger";
import { move } from "../../services/util";
import { Response, Request } from "express";
import { body, param, validationResult, ValidationChain } from "express-validator";
import { Model } from "mongoose";
import { LocationDocument } from "./location-model";
import path from "path";


import multer from "multer";
import { json } from "body-parser";

const moduleName = "location-controller.";
function label(name: string): string {
  return moduleName + name + ": ";
}


const NameValidator: ValidationChain = body ("name", "Location name must have 4-32 characters").exists().trim().isLength({min: 4, max: 32});
const NoNameValidator: ValidationChain = param ("name", "no name provided").not().exists();
const ColorValidator: ValidationChain = body ("color", "no color provided").exists().isHexColor();
const LocationIDValidator: ValidationChain = param ("locationID").exists().isMongoId();
const SensorDescValidator: ValidationChain = body ("sensorDesc").exists();
// .isArray().isLength({min: 0, max: 5}).
// custom((value, { req }) => {
//   for (const item of value) {
//     log.debug("SensorDescValidator: " + JSON.stringify(item));
//     if (item.SN === undefined || item.port === undefined) {
//       log.debug("SensorDescValidator: FALSE:" + JSON.stringify(item));
//       return false;
//     }
//   }
//   return true;
// });
export const createLocationFieldValidator = [NameValidator, ColorValidator];
export const NameFieldValidator = [ NameValidator ];
export const NoNameFieldValidator = [NoNameValidator];
export const LocationIDFieldValidator = [LocationIDValidator];
export const updateNameFieldValidator = [LocationIDValidator, NameValidator];
export const updateColorFieldValidator = [LocationIDValidator, ColorValidator];
export const updateSensorsFieldValidator = [LocationIDValidator, SensorDescValidator];

export let postCreateLocation = (req: Request, res: Response): void => {
    const m = "postCreateLocation, " + res.locals.tenantID;
    const Location: Model<LocationDocument> = res.locals.Location ;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
       res.status(422).json({ errors: errors.mapped() });
       return;
    }

    const name = req.body.name;

    Location.findOne({name: name}).then(location => {
      if (location === null) {
        log.debug(label(m) + "Creating location " + name);
        const color = req.body.color;
        const file: Express.Multer.File = req.file;
        log.debug(label(m) + "file=" + JSON.stringify(req.file));
        log.debug(label(m) + "files=" + JSON.stringify(req.files));
        const newLocation = new Location();
        newLocation.set("name", name);
        newLocation.set("color", color);
        if (file) {
          const locationImageFolder = file.destination + res.locals.tenantID + "/locations/";
          const filename = file.filename + path.extname(file.originalname);
          const finalPath = locationImageFolder + filename;
          newLocation.set("path", finalPath);
          move(file.path, locationImageFolder, filename, (err) => {
            if (err) {
              log.error(label(m) +  "Cannot move " + file.path +
                                    " to destination " + finalPath + ", err=" + JSON.stringify(err));
            } else {
              log.info(label(m) + "Stored location image " + file.originalname + " here: " + finalPath);
            }
          });
        }
        newLocation.save()
        .then((savedLocation) => {
          const body = savedLocation;
          log.info(label(m) + "Saved new location=" + JSON.stringify(body));
          res.status(200).send(body);
        })
        .catch(() => {
          log.error(label(m) + "Error saving location name=" + name);
          res.status(404).send("Cannot save location " + name);
        });
      } else {
          log.debug (label(m) + "A location with that name already exists");
          res.status(404).send("Location " + name + " exists already");
      }
    });
  };

export let getAllLocations = (req: Request, res: Response): void => {
  const m = "getAllLocations, " + res.locals.tenantID;
  const Location: Model<LocationDocument> = res.locals.Location ;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
     res.status(422).json({ errors: errors.mapped() });
     return;
  }

  Location.find({})
  .then(locations => {
    log.info(label(m) + "get #location(s)=" + locations.length);
    const body = locations;
    res.status(200).send(body);
    }
  ).catch((err) => {
    res.status(404).send("No locations found");
    log.error(label(m) + "Error=" + JSON.stringify(err));
  });
};

export let putName = (req: Request, res: Response): void => {
  const m = "putName, " + res.locals.tenantID;
  const Location: Model<LocationDocument> = res.locals.Location ;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
     res.status(422).json({ errors: errors.mapped() });
     return;
  }
  const locationID = req.params.locationID;
  const name = req.body.name;
  const filter = { _id: locationID };
  const update = { name: name };
  const option =  { new: true };

  Location.findOneAndUpdate(filter, update, option).then(location => {
      if (location) {
        const body = location;
        const bodyStr = JSON.stringify(body);
        log.info(label(m) + "Renamed location name with locationID=" + locationID + " to " + name);
        res.status(200).send(body);
      }
      else {
        log.error(label(m) + "Error renaming locationID=" + locationID );
        res.status(404).send("Cannot rename location to" + name);
      }
    }).catch(err => {
      log.info; (label(m) + "The device does not exist");
      res.status(404).send("Cannot rename location");
    });
  };

export let putColor = (req: Request, res: Response): void => {
  const m = "putColor, " + res.locals.tenantID;
  const Location: Model<LocationDocument> = res.locals.Location ;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.mapped() });
      return;
  }
  const locationID = req.params.locationID;
  const color = req.body.color;
  const filter = { _id: locationID };
  const update = { color: color };
  const option =  { new: true };

  Location.findOneAndUpdate(filter, update, option).then(location => {
      if (location) {
        const body =  location;
        const bodyStr = JSON.stringify(body);
        log.info(label(m) + "Updated location color with locationID=" + locationID + " to " + color);
        res.status(200).send(body);
      }
      else {
        log.error(label(m) + "Error updating location color, locationID=" + locationID );
        res.status(404).send("Cannot update location color to " + color);
      }
    }).catch(err => {
      log.info; (label(m) + "The location does not exist");
      res.status(404).send("Cannot update location color");
    });
  };
export let putFile = (req: Request, res: Response): void => {
  const m = "putFile, " + res.locals.tenantID;
  const Location: Model<LocationDocument> = res.locals.Location ;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.mapped() });
      return;
  }

  const file: Express.Multer.File = req.file;
  const locationImageFolder = file.destination + res.locals.tenantID + "/locations/";
  const filename = file.filename + path.extname(file.originalname);
  const finalPath = locationImageFolder + filename;
  move(file.path, locationImageFolder, filename, (err) => {
    if (err) {
      log.error(label(m) +  "Cannot move image " + file.path +
                            " to destination " + finalPath + ", err=" + JSON.stringify(err));
      res.status(404).send("Cannot store location background");
    } else {
      log.info(label(m) + "Stored image " + file.originalname + " here: " + finalPath);
      const locationID = req.params.locationID;
      const filter = { _id: locationID };
      const update = { path: finalPath };
      const option = { new: true };

      Location.findOneAndUpdate(filter, update, option).then(location => {
          if (location) {
            const body  =  location;
            log.info(label(m) + "Updated background image of locationID=" + locationID);
            res.status(200).send(body);
          }
          else {
            log.error(label(m) + "Error updating location image, locationID=" + locationID );
            res.status(404).send("Cannot update location background image: " + file.originalname);
          }
        }).catch(err => {
          log.error(label(m) + "The location does not exist");
          res.status(404).send("Cannot update location background");
        });
    }
  });

  };
export let putSensors = (req: Request, res: Response): void => {
  const m = "putSensors, " + res.locals.tenantID;
  const Location: Model<LocationDocument> = res.locals.Location ;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.mapped() });
      return;
  }
  const locationID = req.params.locationID;
  const sensorDesc = req.body.sensorDesc;
  const filter = { _id: locationID };
  const update = { sensorDesc };
  const option =  { new: true };

  Location.findOneAndUpdate(filter, update, option).then(location => {
      if (location) {
        const body = location;
        log.info(label(m) + "Updated sensors of locationID=" + locationID + " to " + JSON.stringify(sensorDesc));
        res.status(200).send(body);
      }
      else {
        log.error(label(m) + "Error updating sensors, locationID=" + locationID );
        res.status(404).send("Cannot update location sensors to " + JSON.stringify(sensorDesc));
      }
    }).catch(err => {
      log.info; (label(m) + "The location does not exist");
      res.status(404).send("Cannot update location sensors");
    });
  };
export let deleteLocation = (req: Request, res: Response): void => {
  const m = "deleteLocation, " + res.locals.tenantID;
  const Location: Model<LocationDocument> = res.locals.Location ;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
     res.status(422).json({ errors: errors.mapped() });
     return;
  }
  const locationID = req.params.locationID;

  const filter = { _id: locationID };
  Location.findOneAndRemove(filter).then(location => {
    if (location) {
      log.info(label(m) + "Deleted locationID=" + location._id);
      const body =  location;
      res.status(200).send(body);
    } else {
      log.debug(label(m) + "The location does not exist");
      res.status(404).send("Location id=" + locationID + " does not exist");
    }
  });
};

import * as jwt from "../../services/jwt/jwt-handler";
import { default as User } from "./user-model";
import { Request, Response, NextFunction } from "express";
import express from "express";

import { body, check, validationResult } from "express-validator";

import log from "../../services/logger";

import { UserDocument } from "./user-model";

const moduleName = "user-controller.";
function label(name: string): string {
  return moduleName + name + ": ";
}

export const PostValidator = [
  check("email").normalizeEmail({ gmail_remove_dots: false }),
  body ("email", "Email is not valid").exists().isEmail(),
  body ("password", "Password cannot be blank" ).exists().isLength({min: 4})
];

export const DeleteValidator = [
  check("email").normalizeEmail({ gmail_remove_dots: false }),
  body ("email", "Email is not valid").exists().isEmail(),
];
export let postLogin = (req: Request, res: Response, next: NextFunction) => {
  const m = "postLogin";

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    log.info(label(m) + "Validation error");
    log.debug(label(m) + "req.body=" + JSON.stringify(req.body));
    return res.status(401).send("User validation error");
  }

  const email = req.body.email;
  const password = req.body.password;

  User.findOne({ email }, (err: any, user: UserDocument) => {
    const errorMsg = "Invalid username or password";
    if (err) {
      log.error(label(m) + "User.findOne error=" + JSON.stringify(err));
      return res.status(401).send(errorMsg);
    } else if (!user) {
      log.info(label(m) + "Access DENIED, no such user=" + JSON.stringify(email));
      return res.status(401).send(errorMsg);
    } else {
      user.comparePassword(password, (err: Error, isMatch: boolean) => {
        if (err) {
          log.error(label(m) + "user.comparePassword error=" + JSON.stringify(err) + "for tenantID=" + user.tenantID);
          return res.status(401).send(errorMsg);
        }
        if (isMatch) {
          if (!user.tenantID) {
            user.createTenantID();
          }
          const payload = jwt.createPayload(email, user.tenantID);

          jwt.signJWT(payload)
          .then((token) => {
            res.status(200).send({email, token, tenantID: user.get("tenantID")});
            log.info(label(m) + "Signed JWT for user id=" + user.id + ", tenantID=" + user.tenantID);
          })
          .catch(err => {
            res.status(401).send(errorMsg);
            log.error(label(m) + "Cannot sign JWT for user id=" + user.id + ", tenantID=" + user.tenantID);
          });
        } else {
          log.info(label(m) + "Access DENIED, password incorrect for user id=" + user.id + ", tenantID=" + user.tenantID);
          return res.status(401).send(errorMsg);
        }
      });
    }
  });
};

export let postLogout = (req: Request, res: Response) => {
  const m = "logout";
  log.info(label(m) + "user");
  res.status(200).end();
};

export let postSignup = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const m = "postSignup";
  log.info(label(m) + "New user sign-up request");

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    log.info(label(m) + "Validation error");
    log.debug(label(m) + "req.body=" + JSON.stringify(req.body));
    return res.status(401).send("User validation error");
  }

  log.debug(label(m) + "req.body=" + JSON.stringify(req.body));
  const user = new User;
  user.set("email", req.body.email);
  user.set("password", req.body.password);

  // Calling signup when logged in, the new user inherits the tenant ID
  if (res.locals.tenantID) {
      // Is only true if middleware has verified the JWT and set tenant ID
    user.tenantID = res.locals.tenantID;
    log.info(label(m) + "Adding user to existing tenantID= " + user.tenantID);
  } else {
    user.createTenantID();
    log.info(label(m) + "created new tenantID= " + user.tenantID);
  }


  log.debug(label(m) + "check if user exists");
  User.findOne({ email: req.body.email }, (err: any, existingUser: UserDocument) => {
    if (err) {
      log.error(label(m) + "Error finding user " + req.body.email);
      return next(err);
    }
    if (existingUser) {
      log.debug(label(m) + "Cannot create user, user already exists, id=" + existingUser.id);
      return res.status(401).send("Account with that email address already exists");
    }

    log.debug(label(m) + "Save user id=" + user.id);
    user.save((err: any) => {
      if (err) {
        log.error(label(m) + "Error saving user");
        return next(err);
      }
      const payload = jwt.createPayload(user.get("email"), user.get("tenantID"));

      jwt.signJWT(payload)
      .then((token) => {
        res.status(200).send({email: user.get("email"), token: token, tenantID: user.get("tenantID")});
        log.info(label(m) + "New user signed up and logged in");
      })
      .catch(err => {
        res.status(404).send("User created but not logged in");
        log.error(label(m) + "signJWT err=" + JSON.stringify(err));
      });
    });
  });
};

export let deleteUser = (req: express.Request, res: express.Response) => {
  const m = "deleteUser, tenantID=" + res.locals.tenantID;
  log.info(label(m));

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    log.info(label(m) + "Validation error");
    log.debug(label(m) + "req.body=" + JSON.stringify(req.body));
    return res.status(401).send("User validation error");
  }
  const loggedInUser = res.locals.sub;
  const email = req.body.email;
  const filter = { email };


  User.findOne(filter, (err: any, targetUser: UserDocument) => {
    const errorMsg = "Cannot delete user ";
    if (err) {
        log.error(label(m) + "User.findOne error=" + JSON.stringify(err));
        return res.status(403).send(errorMsg);
    } else if (!targetUser) {
        log.info(label(m) + errorMsg + "unknown user:" + JSON.stringify(email));
        return res.status(403).send(errorMsg);
    } else {
       User.findOne({email: loggedInUser}, (err: any, user: UserDocument) => {
        if (err || !user) {
            log.error(label(m) + "User.findOne logged in user: " + loggedInUser + ", error=" + JSON.stringify(err));
            return res.status(403).send(errorMsg);
        }
        const sameTenant: boolean = targetUser.get("tenantID") ===  user.get("tenantID");
        const ownAccount: boolean = targetUser.get("email") === user.get("email");

        const deleteUserAllowed = sameTenant && (( user.isFirstUser()  && !ownAccount) ||
                                         ( !user.isFirstUser() && ownAccount));
         if (deleteUserAllowed) {
           User.deleteOne(filter, (err: any) => {
             if (err) {
               log.error(label(m) + "Cannot delete user, error=" + JSON.stringify(err));
               return res.status(403).send(errorMsg);
             } else {
               log.info(label(m) + "User deleted: " + email);
               return res.status(200).end();
             }
           });
         } else {
           log.info(label(m) + "Deleting the user not allowed, sameTenant: " + sameTenant +
                               ", ownAccount: "  + ownAccount + ", isFirstUser: " + user.isFirstUser());
           return res.status(403).send(errorMsg);
         }
      });


    }
  });
};
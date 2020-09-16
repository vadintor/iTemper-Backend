import * as http from "http";
import * as jwt from "../../services/jwt/jwt-handler";
import log from "../../services/logger";
import { isValidObjectId } from "mongoose";

const moduleName = "auth-jwt.";
function label(name: string): string {
  return moduleName + name + ": ";
}
export interface AuthJWTResponse {
    locals?: {
        tenantID?: string;
        sub?: string;
    };
    error?: string;
}

function jwtOf(authScheme: string): string {
    const matches = authScheme.split(" ");
    if (matches.length === 2 && matches[0].toLowerCase() === "bearer") {
        return matches[1];
    } else {
        return "";
    }
}
export function authJWT (authScheme: string, cb: (res: AuthJWTResponse) => void): void {
    const m = "authJWT";
    const token = jwtOf(authScheme);
    jwt.verifyJWT(token)
    .then(payload => {
        log.info (label(m) + "request authorized for payload=" + JSON.stringify(payload));
        cb ({ locals: {tenantID: payload.tenantID, sub:  payload.sub}});
    })
    .catch (err => {
        log.info (label(m) + "invalid token=");
        cb ( {error: "Erroneous token, log in again" });
      });
  }

import log  from "../../services/logger";
import { Attributes, Category, Descriptor, Sample, SensorInbound, SensorLogInbound } from "./sensor-model";

export function isSensorLogArrayValid(raw: unknown): boolean {
    const m = "sensor-data-validators.isSensorLogArrayValid: ";
    let valid = Array.isArray(raw);
    if (!valid) {
        log.error(m + " - not an array");
    } else {
        const data = raw as SensorLogInbound[];
        data.forEach((sensorLog) => valid = valid && isSensorLogValid(sensorLog));
        if (!valid) {
            log.error(m + " - not valid");
        }
    }
    return valid;
}
export function isSensorLogValid(raw: unknown): boolean {
    const m = "sensor-data-validators.isSensorLogValid: ";
    let valid = isObject(raw);
    if (!valid) {
        log.error(m + " - not an object");
    } else {
        const data = raw as Partial<SensorLogInbound>;
        valid = valid
        && "desc" in data && isDescriptorValid(data.desc)
        && "samples" in data && isSamplesValid(data.samples);
        if (!valid) {
            log.error(m + " - not valid");
        }
    }
    return valid;
}
// export function isSensorInboundValid(raw: unknown): boolean {
//     let valid = isObject(raw);
//     if (!valid) {
//         log.error("sensor-data-validators.isSensorInboundValid - not an object");
//     } else {
//         const data = raw as Partial<SensorInbound>;
//         valid = valid
//         && "_id" in data && typeof data._id === "string"
//         && "deviceID" in data && typeof data.deviceID === "string"
//         && "attr" in data && isAttributesValid(data.attr)
//         && "desc" in data && isDescriptorValid(data.desc)
//         && "samples" in data && isSamplesValid(data.samples);
//         if (!valid) {
//             log.error("sensor-data-validators.isSensorInboundValid - not valid");
//         }
//     }
//     return valid;
// }
function isObject(raw: unknown): boolean {
    return typeof raw === "object" && raw !== null;
}
function isCategoryValid(raw: unknown): boolean {
    let valid = typeof raw === "string";
    if (!valid) {
        log.error("sensor-data-validators.isAttributesValid - not a string");
    } else {
        const value = raw as string;
        valid = valid && value in Category;
        if (!valid) {
            log.error("sensor-data-validators.isCategoryValid - not valid");
        }
    }
    return valid;
}
export function isAttributesValid(raw: unknown): boolean {
    let valid = isObject(raw);
    if (!valid) {
        log.error("sensor-data-validators.isAttributesValid - not an object");
    } else {
        const attr = raw as Partial<Attributes>;
        valid = valid
        && "accuracy" in attr && typeof attr.accuracy === "number"
        && "category"  in attr && isCategoryValid(attr.category)
        && "maxSampleRate"  in attr && typeof attr.maxSampleRate === "number"
        && "model" in attr && typeof attr.model === "string"
        && "resolution" in attr && typeof attr.resolution === "number";
        if (!valid) {
            log.error("sensor-data-validators.isAttributesValid - not valid");
        }
    }
    return valid;
}
export function isDescriptorArrayValid(raw: unknown): boolean {
    let valid = Array.isArray(raw);
    if (!valid) {
        log.error("sensor-data-validators.isDescriptorArrayValid - not an array");
    } else {
        const data = raw as Descriptor[];
        data.forEach((sensorData) => valid = valid && isDescriptorValid(sensorData));
        if (!valid) {
            log.error("sensor-data-validators.isDescriptorArrayValid - not valid");
        }
    }
    return valid;
}
export function isDescriptorValid(raw: unknown): boolean {
    let valid = isObject(raw);
    if (!valid) {
        log.error("sensor-data-validators.isDescriptorValid - not an object");
    } else {
        const desc = raw as Partial<Descriptor>;
        valid = valid
        && "SN" in desc && typeof desc.SN === "string";
        if (!valid) {
            log.error("sensor-data-validators.isDescriptorValid - SN not valid:" + desc.SN);
        }
        valid = valid
        && "port" in desc && typeof desc.port === "number" && desc.port >= 0;
        if (!valid) {
            log.error("sensor-data-validators.isDescriptorValid - port not valid: " + desc.port);
        }
    }
    return valid;
}
export function isSamplesValid(raw: unknown): boolean {
    let valid = Array.isArray(raw);
    if (!valid) {
        log.error("sensor-data-validators.isSamplesValid - not an array");
    } else {
        const data = raw as Partial<Sample[]>;
        data.forEach((sample) => {
            valid = valid && !!sample
            && !!sample.date && typeof sample.date === "number" && sample.date >= 0
            && !!sample.value && typeof sample.value === "number";
        });
        if (!valid) {
            log.error("sensor-data-validators.isSamplesValid - not valid");
        }
    }
    return valid;
}

import mongoose from "mongoose";

export enum Category {
  Temperature,
  AbsoluteHumidity,
  RelativeHumidity,
  WindSpeed,
}
export interface Sample {
  value: number;
  date: number;
}
export interface Descriptor {
  SN: string;
  port: string;
}
export interface Attributes {
   model: string;
   category: Category;
   accuracy: number;
   resolution: number;
   maxSampleRate: number;
}
export interface SensorInbound {
  deviceID: string;
  desc: Descriptor;
  attr: Attributes;
}
export interface Sensor {
  deviceID: string;
  desc: Descriptor;
  attr: Attributes;
}
export interface SensorOutbound extends Sensor {
  _id: string;
}
// export interface Log {
//   date: number;
//   value: number;
// }

export interface SensorDocument extends Sensor, mongoose.Document {}

export const SensorSchema = new mongoose.Schema({
    deviceID: String,
    desc: {
      SN: String,
      port: Number
    },
    attr: {
      model: String,
      category: String,
      accuracy: Number,
      resolution: Number,
      maxSampleRate: Number
    },
});
export interface SensorLogInbound {
  deviceID: string;
  desc: Descriptor;
  samples: Sample[];
}
export interface SensorLog extends SensorLogInbound {
  count: number;
  first: number;
  last: number;
  Date: Date;
}
export interface SensorLogOutbound extends SensorLog {
  _id: string;
}

export const SensorLogSchema = new mongoose.Schema({
  deviceID: String,
  desc: {
    SN: String,
    port: Number
  },
  samples: [{
    _id: false,  // if true, Mongodb creates _id implicitly. We do not want that here
    date: Number,
    value: Number
  }],
  count: Number,
  first: Number,
  last: Number,
  date: Date
},
// usePushEach: Enables push of each sensors value, otherwise the pushed values
// will be treated as a separate array object in the samples array
{
  usePushEach: true
});
export interface SensorLogDocument extends SensorLog, mongoose.Document {}



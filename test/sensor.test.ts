
import log from "../src/services/logger";
log.setLevel("debug");
import { app } from "../src/server";
import supertest  from "supertest";
const request = supertest(app);

import * as TestDbs from "./dbs";

let token: string = "";
let tenantID: string = "";
let name: string = "";
let deviceID: string = "";
let key: string = "";

beforeAll(async done => {
  TestDbs.initDatabases();
  let res = await request
  .post("/signup")
  .send({
    email: "test1@test.com",
    password: "Hemligt",
    confirmPassword: "Hemligt"
  });
  expect(res.status).toBe(200);
  expect(res.body.token).toBeDefined();
  expect(res.body.tenantID).toBeDefined();
  token = res.body.token;
  tenantID = res.body.tenantID;

  res = await request
  .post("/devices")
  .set("Authorization", "bearer " + token)
  .send({
    name: "Hejhopp",
  });
  expect(res.status).toBe(200);
  expect(res.body.name).toBeDefined();
  expect(res.body.deviceID).toBeDefined();
  expect(res.body.key).toBeDefined();
  name = res.body.name;
  deviceID = res.body.deviceID;
  key = res.body.key;
  log.debug("deviceID.test.beforeAll: deviceID=" + deviceID);
  done();
});

afterAll(async done => {
  TestDbs.closeDatabases();
  done();
});

describe("REGISTER SENSOR", () => {
  test("Register a sensor should return 200", async done => {
    const sensor = { desc: {SN: "Hejhopp", port: 0}, attr: { model: "Gold", category: "Temperature", accuracy: 2, resolution: 3, maxSampleRate: 1}};
    const res = await request
    .post("/sensors")
    .set("Authorization", "bearer " + key)
    .send(sensor);
    expect(res.status).toBe(200);
    done();
  });
});

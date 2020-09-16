
import log from "../src/services/logger";
log.setLevel("error");
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
    name: "Hejhoppilingonskogen",
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

describe("REGISTER DEVICE VALIDATION", () => {
  test("Register a device without a name should return 422", async done => {
    const res = await request
    .post("/devices")
    .set("Authorization", "bearer " + token)
    .send({});
    expect(res.status).toBe(422);
    done();
  });
  test("Register a device name twice should return 404", async done => {
    const res = await request
    .post("/devices")
    .set("Authorization", "bearer " + token)
    .send({
      name: "Hejhoppilingonskogen",
    });
    expect(res.status).toBe(404);
    done();
  });
});

describe("RENAME DEVICE", () => {

  test("Rename a device without a deviceID should return 404", async done => {
    const res = await request
    .put("/devices")
    .set("Authorization", "bearer " + token)
    .send({});
    expect(res.status).toBe(404);
    done();
  });
  test("Rename a device with deviceID but without a name should return 422", async done => {
    const res = await request
    .put("/devices/" + deviceID)
    .set("Authorization", "bearer " + token)
    .send({});
    expect(res.status).toBe(422);
    done();
  });
  test("Rename a device to self should return 200", async done => {
    const res = await request
    .put("/devices/" + deviceID)
    .set("Authorization", "bearer " + token)
    .send({name: "Hejhoppilingonskogen", });
    expect(res.status).toBe(200);
    done();
  });
  test("Rename a device too short name should return 422", async done => {
    const res = await request
    .put("/devices/" + deviceID)
    .set("Authorization", "bearer " + token)
    .send({name: "Hej", });
    expect(res.status).toBe(422);
    done();
  });
  test("Rename a device should return 200", async done => {
    const res = await request
    .put("/devices/" + deviceID)
    .set("Authorization", "bearer " + token)
    .send({name: "Hejhopp", });
    expect(res.status).toBe(200);
    done();
  });
});

describe("GET DEVICE(S)", () => {
    test("Get all devices should return 200", async done => {
      const res = await request
      .get("/devices")
      .set("Authorization", "bearer " + token)
      .send({});
      expect(res.status).toBe(200);
      done();
  });

  test("Get a device should return 200", async done => {
    const res = await request
    .get("/devices/" + deviceID)
    .set("Authorization", "bearer " + token)
    .send({});
    expect(res.status).toBe(200);
    done();
});

});

describe("DELETE DEVICE(S)", () => {
  test("Delete a device without deviceID should return 404", async done => {
    const res = await request
    .delete("/devices")
    .set("Authorization", "bearer " + token)
    .send({});
    expect(res.status).toBe(404);
    done();
  });

  test("Delete a device with a non-UUID deviceID should return 422", async done => {
    const res = await request
    .delete("/devices/" + "abc")
    .set("Authorization", "bearer " + token)
    .send({});
    expect(res.status).toBe(422);
    done();
  });

  test("Delete a device with a wrong UUID should return 404", async done => {
    const res = await request
    .delete("/devices/" + "a65b6d7b-8bb9-43ee-83ba-8becd0e2fce1")
    .set("Authorization", "bearer " + token)
    .send({});
    expect(res.status).toBe(404);
    done();
  });

  test("Delete an existing device should return device name and deviceID", async done => {
    const res = await request
    .delete("/devices/" + deviceID)
    .set("Authorization", "bearer " + token)
    .send({});
    expect(res.status).toBe(200);
    expect(res.body.name).toBeDefined();
    expect(res.body.deviceID).toBeDefined();
    done();
  });

});
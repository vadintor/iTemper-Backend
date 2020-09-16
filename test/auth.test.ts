
import log from "../src/services/logger";
log.setLevel("error");
import { app } from "../src/server";
import supertest  from "supertest";
const request = supertest(app);

import * as TestDbs from "./dbs";

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
  done();
});

afterAll(async done => {
  TestDbs.closeDatabases();
  done();
});

let token: string = "";
let tenantID: string = "";
let name: string = "";
let deviceID: string = "";
let key: string = "";

describe("AUTHENTICATION - authorizeJWT", () => {
  test("No Authorization header should return 401", async done => {
    const res = await request
    .get("/devices")
    .send({});
    expect(res.status).toBe(401);
    done();
  });
  test("Invalid JWT should return 401", async done => {
    const res = await request
    .get("/devices")
    .set("Authorization", "bearer true")
    .send({});
    expect(res.status).toBe(401);
    done();
  });
  test("no bearer should return 401", async done => {
    const res = await request
    .get("/devices")
    .set("Authorization", token)
    .send({});
    expect(res.status).toBe(401);
    done();
  });
  test("Invalid bearer should return 401", async done => {
    const res = await request
    .get("/devices")
    .set("Authorization", "bear " + token)
    .send({ });
    expect(res.status).toBe(401);
    done();
  });
  test("Correct credentials should return 200 and JWT", async done => {
    const res = await request
    .get("/devices")
    .set("Authorization", "bearer " + token)
    .send({ });
    expect(res.status).toBe(200);
    done();
  });
});

describe("AUTHENTICATION - authorizeAPIKey", () => {

  test("No API Key should return 401", async done => {
    const res = await request
    .post("/devices")
    .send({});
    expect(res.status).toBe(401);
    done();
  });
  test("Invalid API Key should return 401", async done => {
    const res = await request
    .post("/devices")
    .set("Authorization", "bearer true")
    .send({});
    expect(res.status).toBe(401);
    done();
  });
  test("no bearer should return 401", async done => {
    const res = await request
    .post("/devices")
    .set("Authorization", key)
    .send({});
    expect(res.status).toBe(401);
    done();
  });
  test("Invalid bearer should return 401", async done => {
    const res = await request
    .post("/devices")
    .set("Authorization", "bear " + key)
    .send({});
    expect(res.status).toBe(401);
    done();
  });
  test("Correct API Key should NOT return return 401", async done => {
    const res = await request
    .post("/sensors")
    .set("Authorization", "bearer " + key)
    .send({});
    expect(res.status).not.toBe(401);
    done();
  });
});

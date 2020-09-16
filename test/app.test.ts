
import log from "../src/services/logger";
log.setLevel("error");
import { app } from "../src/server";
import supertest  from "supertest";
const request = supertest(app);

import * as TestDbs from "./dbs";

beforeAll((done) => {
  TestDbs.initDatabases();
  done();
});

afterAll((done) => {
  TestDbs.closeDatabases();
  done();
});
let token: string = "";
let tenantID: string = "";

describe("POST /", () => {
  test("should return 200", async done => {
    const res = await request
    .post("/")
    .send({});
    expect(res.status).toBe(200);
    done();
  });
});

describe("GET /", () => {
  test("should return 200", async done => {
    const res = await request
    .get("/")
    .send({});
    expect(res.status).toBe(200);
    done();
  });
});
describe("POST /signup", () => {
    test("New user should return 200 and JWT token", async done => {
      const res = await request
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
      done();
    });

    test("Already existing user should return 401", async done => {
      const res = await request
      .post("/signup")
      .send({
        email: "test1@test.com",
        password: "Hemligt",
        confirmPassword: "Hemligt"
      });
      expect(res.status).toBe(401);
      done();
    });
    test("Incorrect password length should return 401", async done => {
      const res = await request
      .post("/signup")
      .send({
        email: "test3@test.com",
        password: "Hem",
        confirmPassword: "Hem"
      });
      expect(res.status).toBe(401);
      done();
    });

});
describe("POST /users/add", () => {
  test("New user when logged in should return 200, JWT token and the same tenantID", async done => {
    const res = await request
    .post("/users/add")
    .set("Authorization", "bearer " + token)
    .send({
      email: "test2@test.com",
      password: "Hemligt",
      confirmPassword: "Hemligt"
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.tenantID).toBeDefined();
    expect(res.body.tenantID).toBe(tenantID);
    done();
});
});

describe("POST /login", () => {
    test("None existing username should return 401", async done => {
        const res = await request
        .post("/login")
        .send({
          email: "test3@test.com",
          password: "Hemligt",
        });
        expect(res.status).toBe(401);
        done();
    });
    test("Invalid username should return 401", async done => {
        const res = await request
        .post("/login")
        .send({
          email: "test1",
          password: "Hemligt",
        });
        expect(res.status).toBe(401);
        done();
    });
    test("Correct credentials should return 200 and JWT token", async done => {
        const res = await request
        .post("/login")
        .send({
          email: "test1@test.com",
          password: "Hemligt",
        });
        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
        done();
    });
    test("Logging in added user should return 200 and JWT and inherent tenantID", async done => {
      const res = await request
      .post("/login")
      .send({
        email: "test2@test.com",
        password: "Hemligt",
      });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.tenantID).toBe(tenantID);
      done();
  });
});
describe("POST /logout", () => {
  test("logging out with correct credentials should return 200", async done => {
    const res = await request
    .post("/logout")
    .set("Authorization", "bearer " + token)
    .set({ "content-type": "application/json" })
    .send({
      email: "test1@test.com",
      password: "Hemligt",
    });
    expect(res.status).toBe(200);
    done();
  });
  test("logging out without JWT token should return 401", async done => {
    const res = await request
    .post("/logout")
    .set({ "content-type": "application/json" })
    .send({
      email: "test1@test.com",
      password: "Hemligt",
    });
    expect(res.status).toBe(401);
    done();
  });
});
describe("DELETE /users/delete", () => {
  test("Can delete added user", async done => {
    const res = await request
    .delete("/users/delete")
    .set("Authorization", "bearer " + token)
    .set({ "content-type": "application/json" })
    .send({
      email: "test2@test.com",
    });
    expect(res.status).toBe(200);
    done();
  });
  test("Logging in deleted user should return 401 and no JWT", async done => {
    const res = await request
    .post("/login")
    .send({
      email: "test2@test.com",
      password: "Hemligt",
    });
    expect(res.status).toBe(401);
    expect(res.body.token).not.toBeDefined();
    done();
});
  test("Cannot delete first user", async done => {
    const res = await request
    .delete("/users/delete")
    .set("Authorization", "bearer " + token)
    .set({ "content-type": "application/json" })
    .send({
      email: "test1@test.com",
    });
    expect(res.status).toBe(403);
    done();
  });
});
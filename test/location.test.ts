
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
let locationID: string = "";

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

describe("CREATE LOCATION", () => {
  test("Create a location without a name should return 422", async done => {
    const res = await request
    .post("/locations")
    .set("Authorization", "bearer " + token)
    .send({});
    expect(res.status).toBe(422);
    done();
  });
  test("Create a location with a too short name (3 chars) should return 422", async done => {
    const res = await request
    .post("/locations")
    .set("Authorization", "bearer " + token)
    .send({name: "tre", color: "#ffffff"});
    expect(res.status).toBe(422);
    done();
  });
  test("Create a location with a correct name should return 200", async done => {
    const res = await request
    .post("/locations")
    .set("Authorization", "bearer " + token)
    .send({name: "fyra", color: "#ffffff"});
    expect(res.status).toBe(200);
    done();
  });
});


describe("GET LOCATIONS(S)", () => {
    test("Get all locations should return 200", async done => {
      const res = await request
      .get("/locations")
      .set("Authorization", "bearer " + token)
      .send({});
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBeDefined();
      expect(res.body[0].name).toEqual("fyra");
      expect(res.body[0].color).toBeDefined();
      expect(res.body[0].color).toEqual("#ffffff");
      done();
  });
});

describe("RENAME LOCATION", () => {
test("Get all locations should return 200", async done => {
    const res = await request
    .get("/locations")
    .set("Authorization", "bearer " + token)
    .send({});
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]._id).toBeDefined();
    locationID = res.body[0]._id;
    done();
});

  test("Rename a location without a locationID should return 404", async done => {
    const res = await request
    .put("/locations")
    .set("Authorization", "bearer " + token)
    .send({});
    expect(res.status).toBe(404);
    done();
  });
  test("Rename a location with location but without a name should return 422", async done => {
    const res = await request
    .put("/locations/" + locationID + "/name")
    .set("Authorization", "bearer " + token)
    .send({});
    expect(res.status).toBe(422);
    done();
  });
  test("Rename a location to self should return 200", async done => {
    const res = await request
    .put("/locations/" + locationID + "/name")
    .set("Authorization", "bearer " + token)
    .send({name: "fyra", });
    expect(res.status).toBe(200);
    done();
  });
  test("Rename a location too short name should return 422", async done => {
    const res = await request
    .put("/locations/" + locationID + "/name")
    .set("Authorization", "bearer " + token)
    .send({name: "tre", });
    expect(res.status).toBe(422);
    done();
  });
  test("Rename a location should return 200", async done => {
    const res = await request
    .put("/locations/" + locationID + "/name")
    .set("Authorization", "bearer " + token)
    .send({name: "Åtta", });
    expect(res.status).toBe(200);
    done();
  });
});

describe("SET LOCATION COLOR", () => {
    test("Get all locations should return 200", async done => {
        const res = await request
        .get("/locations")
        .set("Authorization", "bearer " + token)
        .send({});
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0]._id).toBeDefined();
        locationID = res.body[0]._id;
        done();
    });
    test("Set a location color without a locationID should return 404", async done => {
      const res = await request
      .put("/locations")
      .set("Authorization", "bearer " + token)
      .send({});
      expect(res.status).toBe(404);
      done();
    });
    test("set a location color with location but without a color should return 422", async done => {
      const res = await request
      .put("/locations/" + locationID + "/color")
      .set("Authorization", "bearer " + token)
      .send({});
      expect(res.status).toBe(422);
      done();
    });

    test("Set a wrong location color value should return 422", async done => {
      const res = await request
      .put("/locations/" + locationID + "/color")
      .set("Authorization", "bearer " + token)
      .send({color: "tre", });
      expect(res.status).toBe(422);
      done();
    });
    test("Set a valid location color value should return 200", async done => {
      const res = await request
      .put("/locations/" + locationID + "/color")
      .set("Authorization", "bearer " + token)
      .send({color: "#000000", });
      expect(res.status).toBe(200);
      done();
    });
  });

// describe("SET LOCATION FILE", () => {
//     test("Set a location FILE without a locationID should return 404", async done => {
//       const res = await request
//       .put("/locations")
//       .set("Authorization", "bearer " + token)
//       .send({});
//       expect(res.status).toBe(404);
//       done();
//     });
//     test("set a location FILE with location but without a file should return 422", async done => {
//       const res = await request
//       .put("/locations/" + locationID + "/file")
//       .set("Authorization", "bearer " + token)
//       .send({});
//       expect(res.status).toBe(422);
//       done();
//     });

//     test("Set a valid location file value should return 200", async done => {
//       const res = await request
//       .put("/locations/" + locationID + "/file")
//       .set("Authorization", "bearer " + token)
//       .send({file: "#000000", });
//       expect(res.status).toBe(200);
//       done();
//     });
//   });

describe("GET LOCATIONS(S) AFTER UPDATES", () => {
test("Get all locations after an update should return 200 and updated location values", async done => {
    const res = await request
    .get("/locations")
    .set("Authorization", "bearer " + token)
    .send({});
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBeDefined();
    expect(res.body[0].name).toEqual("Åtta");
    expect(res.body[0].color).toBeDefined();
    expect(res.body[0].color).toEqual("#000000");
    locationID = res.body[0]._id;
    done();
});
});


describe("SET SENSORS", () => {
    test("Set a sensor without a locationID should return 404", async done => {
      const res = await request
      .put("/location/sensors")
      .set("Authorization", "bearer " + token)
      .send({});
      expect(res.status).toBe(404);
      done();
    });
    test("Set a location sensor with locationID but without a sensor desc should return 422", async done => {
      const res = await request
      .put("/locations/" + locationID + "/sensors")
      .set("Authorization", "bearer " + token)
      .send({});
      expect(res.status).toBe(422);
      done();
    });
    test("Set a location sensor with invalid sensor desc should return 422", async done => {
        const res = await request
        .put("/locations/" + locationID + "/sensors")
        .set("Authorization", "bearer " + token)
        .send({desc: {sn: "123456", port: 0}, });
        expect(res.status).toBe(422);
        done();
      });
    test("Set a location sensor valid sensor desc should return 422", async done => {
      const res = await request
      .put("/locations/" + locationID + "/sensors")
      .set("Authorization", "bearer " + token)
      .send({sensorDesc: {sn: "123456", port: 0}, });
      expect(res.status).toBe(200);
      done();
    });
});
describe("DELETE LOCATIONS(S)", () => {
  test("Delete a location without location should return 404", async done => {
    const res = await request
    .delete("/locations")
    .set("Authorization", "bearer " + token)
    .send({});
    expect(res.status).toBe(404);
    done();
  });

  test("Delete a location with a non-UUID deviceID should return 422", async done => {
    const res = await request
    .delete("/locations/" + "abc")
    .set("Authorization", "bearer " + token)
    .send({});
    expect(res.status).toBe(422);
    done();
  });

  test("Delete an existing location should return location name, color and locationID", async done => {
    const res = await request
    .delete("/locations/" + locationID)
    .set("Authorization", "bearer " + token)
    .send({});
    expect(res.status).toBe(200);
    expect(res.body.name).toBeDefined();
    expect(res.body.color).toBeDefined();
    expect(res.body._id).toBeDefined();
    done();
  });

});
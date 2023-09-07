import request from "supertest";
import app from "../src/app";

describe("Api request", () => {
  it("should return status 200 on GET", async () => {
    const res = await request(app).get("/folder/testparam1");
    expect(res.statusCode).toEqual(200);
  });

  it("should return status 200 on POST", async () => {
    const res = await request(app).post("/folder/testparam2");
    expect(res.statusCode).toEqual(200);
  });

  it("should return status 404", async () => {
    const res = await request(app).get("/notfoundtest");
    expect(res.statusCode).toEqual(404);
  });
});

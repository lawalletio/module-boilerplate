import request from "supertest";
import app from "../src/app"; // adjust the import path accordingly

describe("User Route", () => {
  it("should return all users", async () => {
    const res = await request(app).get("/api/users");
    expect(res.statusCode).toEqual(200);
  });
});

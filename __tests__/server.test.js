"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const api_1 = __importDefault(require("../api")); // adjust the import path accordingly
describe("User Route", () => {
    it("should return all users", async () => {
        const res = await (0, supertest_1.default)(api_1.default).get("/api/users");
        expect(res.statusCode).toEqual(200);
    });
});
//# sourceMappingURL=server.test.js.map
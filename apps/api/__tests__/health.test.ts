import request from "supertest";
import app from "../src/app.js";

describe("Health endpoint", () => {
  it("GET /api/v1/health should return status ok", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("ok");
  });
});

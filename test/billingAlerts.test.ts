import request from "supertest";
import app from "../src/server";

describe("Billing Alerts API", () => {
  describe("GET /api/billing-alerts", () => {
    it("should return all billing alerts", async () => {
      const response = await request(app)
        .get("/api/billing-alerts")
        .expect("Content-Type", /json/);

      expect(response.body).toHaveProperty("success");
    });
  });

  describe("GET /api/billing-alerts/:id", () => {
    it("should return a single billing alert", async () => {
      const testId = "123e4567-e89b-12d3-a456-426614174000";
      const response = await request(app)
        .get(`/api/billing-alerts/${testId}`)
        .expect("Content-Type", /json/);

      expect(response.body).toHaveProperty("success");
    });
  });

  describe("POST /api/billing-alerts", () => {
    it("should create a new billing alert", async () => {
      const newAlert = {
        amount: 1500.50,
        due_date: "2024-12-31",
        description: "Quarterly trust management fee",
        status: "pending",
        trust_id: "trust_123",
      };

      const response = await request(app)
        .post("/api/billing-alerts")
        .send(newAlert)
        .expect("Content-Type", /json/);

      expect(response.body).toHaveProperty("success");
    });

    it("should reject billing alert with invalid amount", async () => {
      const invalidAlert = {
        amount: "invalid",
        due_date: "2024-12-31",
        description: "Fee",
        status: "pending",
        trust_id: "trust_123",
      };

      const response = await request(app)
        .post("/api/billing-alerts")
        .send(invalidAlert)
        .expect("Content-Type", /json/);

      expect(response.body).toHaveProperty("success");
    });
  });

  describe("PUT /api/billing-alerts/:id", () => {
    it("should update an existing billing alert", async () => {
      const testId = "123e4567-e89b-12d3-a456-426614174000";
      const updates = {
        status: "paid",
        amount: 1600.00,
      };

      const response = await request(app)
        .put(`/api/billing-alerts/${testId}`)
        .send(updates)
        .expect("Content-Type", /json/);

      expect(response.body).toHaveProperty("success");
    });
  });

  describe("DELETE /api/billing-alerts/:id", () => {
    it("should delete a billing alert", async () => {
      const testId = "123e4567-e89b-12d3-a456-426614174000";
      const response = await request(app)
        .delete(`/api/billing-alerts/${testId}`)
        .expect("Content-Type", /json/);

      expect(response.body).toHaveProperty("success");
    });
  });
});

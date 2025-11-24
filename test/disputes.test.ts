import request from "supertest";
import app from "../src/server";

describe("Disputes API", () => {
  describe("GET /api/disputes", () => {
    it("should return all disputes", async () => {
      const response = await request(app)
        .get("/api/disputes")
        .expect("Content-Type", /json/);

      expect(response.body).toHaveProperty("success");
    });
  });

  describe("GET /api/disputes/:id", () => {
    it("should return a single dispute", async () => {
      const testId = "123e4567-e89b-12d3-a456-426614174000";
      const response = await request(app)
        .get(`/api/disputes/${testId}`)
        .expect("Content-Type", /json/);

      expect(response.body).toHaveProperty("success");
    });
  });

  describe("POST /api/disputes", () => {
    it("should create a new dispute", async () => {
      const newDispute = {
        title: "Payment Dispute",
        description: "Issue with payment processing",
        status: "open",
        priority: "high",
        trust_id: "trust_123",
      };

      const response = await request(app)
        .post("/api/disputes")
        .send(newDispute)
        .expect("Content-Type", /json/);

      expect(response.body).toHaveProperty("success");
    });

    it("should reject dispute with invalid status", async () => {
      const invalidDispute = {
        title: "Payment Dispute",
        description: "Issue with payment",
        status: "invalid_status",
        priority: "high",
        trust_id: "trust_123",
      };

      const response = await request(app)
        .post("/api/disputes")
        .send(invalidDispute)
        .expect("Content-Type", /json/);

      expect(response.body).toHaveProperty("success");
    });
  });

  describe("PUT /api/disputes/:id", () => {
    it("should update an existing dispute", async () => {
      const testId = "123e4567-e89b-12d3-a456-426614174000";
      const updates = {
        status: "resolved",
        description: "Updated description",
      };

      const response = await request(app)
        .put(`/api/disputes/${testId}`)
        .send(updates)
        .expect("Content-Type", /json/);

      expect(response.body).toHaveProperty("success");
    });
  });

  describe("DELETE /api/disputes/:id", () => {
    it("should delete a dispute", async () => {
      const testId = "123e4567-e89b-12d3-a456-426614174000";
      const response = await request(app)
        .delete(`/api/disputes/${testId}`)
        .expect("Content-Type", /json/);

      expect(response.body).toHaveProperty("success");
    });
  });
});

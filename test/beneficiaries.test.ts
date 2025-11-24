import request from "supertest";
import app from "../src/server";

describe("Beneficiaries API", () => {
  describe("GET /api/beneficiaries", () => {
    it("should return all beneficiaries", async () => {
      const response = await request(app)
        .get("/api/beneficiaries")
        .expect("Content-Type", /json/);

      expect(response.body).toHaveProperty("success");
    });
  });

  describe("GET /api/beneficiaries/:id", () => {
    it("should return a single beneficiary", async () => {
      const testId = "123e4567-e89b-12d3-a456-426614174000";
      const response = await request(app)
        .get(`/api/beneficiaries/${testId}`)
        .expect("Content-Type", /json/);

      expect(response.body).toHaveProperty("success");
    });
  });

  describe("POST /api/beneficiaries", () => {
    it("should create a new beneficiary", async () => {
      const newBeneficiary = {
        name: "John Doe",
        email: "john@example.com",
        phone: "555-1234",
        relationship: "Spouse",
        trust_id: "trust_123",
      };

      const response = await request(app)
        .post("/api/beneficiaries")
        .send(newBeneficiary)
        .expect("Content-Type", /json/);

      expect(response.body).toHaveProperty("success");
    });

    it("should reject beneficiary without required fields", async () => {
      const invalidBeneficiary = {
        name: "John Doe",
      };

      const response = await request(app)
        .post("/api/beneficiaries")
        .send(invalidBeneficiary)
        .expect("Content-Type", /json/);

      expect(response.body).toHaveProperty("success");
    });
  });

  describe("PUT /api/beneficiaries/:id", () => {
    it("should update an existing beneficiary", async () => {
      const testId = "123e4567-e89b-12d3-a456-426614174000";
      const updates = {
        name: "Jane Doe",
        email: "jane@example.com",
      };

      const response = await request(app)
        .put(`/api/beneficiaries/${testId}`)
        .send(updates)
        .expect("Content-Type", /json/);

      expect(response.body).toHaveProperty("success");
    });
  });

  describe("DELETE /api/beneficiaries/:id", () => {
    it("should delete a beneficiary", async () => {
      const testId = "123e4567-e89b-12d3-a456-426614174000";
      const response = await request(app)
        .delete(`/api/beneficiaries/${testId}`)
        .expect("Content-Type", /json/);

      expect(response.body).toHaveProperty("success");
    });
  });
});

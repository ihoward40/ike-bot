import { Router, Response } from "express";
import { body, validationResult } from "express-validator";
import { supabase } from "../config/database";
import { authenticate, AuthRequest } from "../middleware/auth";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { Beneficiary } from "../types";

const router = Router();

// Get all beneficiaries
router.get(
  "/",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { data, error } = await supabase
      .from("beneficiaries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new AppError(500, error.message);
    res.json({ beneficiaries: data });
  })
);

// Get a single beneficiary
router.get(
  "/:id",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { data, error } = await supabase
      .from("beneficiaries")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) throw new AppError(404, "Beneficiary not found");
    res.json({ beneficiary: data });
  })
);

// Create a beneficiary
router.post(
  "/",
  authenticate,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("relationship").notEmpty().withMessage("Relationship is required"),
  ],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(400, errors.array()[0].msg);
    }

    const beneficiary: Beneficiary = req.body;
    const { data, error } = await supabase
      .from("beneficiaries")
      .insert([{ ...beneficiary, created_at: new Date().toISOString() }])
      .select()
      .single();

    if (error) throw new AppError(500, error.message);
    res.status(201).json({ beneficiary: data });
  })
);

// Update a beneficiary
router.put(
  "/:id",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { data, error } = await supabase
      .from("beneficiaries")
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw new AppError(500, error.message);
    res.json({ beneficiary: data });
  })
);

// Delete a beneficiary
router.delete(
  "/:id",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { error } = await supabase
      .from("beneficiaries")
      .delete()
      .eq("id", req.params.id);

    if (error) throw new AppError(500, error.message);
    res.json({ message: "Beneficiary deleted successfully" });
  })
);

export default router;

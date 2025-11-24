import { Router, Response } from "express";
import { body, validationResult } from "express-validator";
import { supabase } from "../config/database";
import { authenticate, AuthRequest } from "../middleware/auth";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { TrustNotice } from "../types";
import { sendEmail } from "../services/sendgrid";
import { logToNotion } from "../services/notion";

const router = Router();

// Get all trust notices
router.get(
  "/",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { data, error } = await supabase
      .from("trust_notices")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new AppError(500, error.message);
    res.json({ notices: data });
  })
);

// Get a single trust notice
router.get(
  "/:id",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { data, error } = await supabase
      .from("trust_notices")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) throw new AppError(404, "Trust notice not found");
    res.json({ notice: data });
  })
);

// Create a trust notice
router.post(
  "/",
  authenticate,
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("notice_type").notEmpty().withMessage("Notice type is required"),
  ],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(400, errors.array()[0].msg);
    }

    const notice: TrustNotice = {
      ...req.body,
      status: req.body.status || "pending",
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("trust_notices")
      .insert([notice])
      .select()
      .single();

    if (error) throw new AppError(500, error.message);

    // Log to Notion
    await logToNotion({
      title: `Trust Notice: ${data.title}`,
      details: data.description,
      type: data.notice_type,
    });

    // Send email notification if beneficiary is specified
    if (data.beneficiary_id) {
      const { data: beneficiary } = await supabase
        .from("beneficiaries")
        .select("email, name")
        .eq("id", data.beneficiary_id)
        .single();

      if (beneficiary && beneficiary.email) {
        await sendEmail({
          to: beneficiary.email,
          subject: `Trust Notice: ${data.title}`,
          text: data.description,
        });
      }
    }

    res.status(201).json({ notice: data });
  })
);

// Update a trust notice
router.put(
  "/:id",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { data, error } = await supabase
      .from("trust_notices")
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw new AppError(500, error.message);
    res.json({ notice: data });
  })
);

// Delete a trust notice
router.delete(
  "/:id",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { error } = await supabase
      .from("trust_notices")
      .delete()
      .eq("id", req.params.id);

    if (error) throw new AppError(500, error.message);
    res.json({ message: "Trust notice deleted successfully" });
  })
);

export default router;

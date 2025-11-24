import { Router, Response } from "express";
import { body, validationResult } from "express-validator";
import { supabase } from "../config/database";
import { authenticate, AuthRequest } from "../middleware/auth";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { BillingAlert } from "../types";
import { sendEmail } from "../services/sendgrid";

const router = Router();

// Get all billing alerts
router.get(
  "/",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { status } = req.query;
    let query = supabase.from("billing_alerts").select("*");

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw new AppError(500, error.message);
    res.json({ billing_alerts: data });
  })
);

// Get a single billing alert
router.get(
  "/:id",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { data, error } = await supabase
      .from("billing_alerts")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) throw new AppError(404, "Billing alert not found");
    res.json({ billing_alert: data });
  })
);

// Create a billing alert
router.post(
  "/",
  authenticate,
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("amount").isNumeric().withMessage("Amount must be a number"),
    body("alert_type")
      .isIn(["payment_due", "overdue", "payment_received", "refund"])
      .withMessage("Invalid alert type"),
  ],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(400, errors.array()[0].msg);
    }

    const alert: BillingAlert = {
      ...req.body,
      status: req.body.status || "active",
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("billing_alerts")
      .insert([alert])
      .select()
      .single();

    if (error) throw new AppError(500, error.message);

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
          subject: `Billing Alert: ${data.title}`,
          text: `${data.description}\n\nAmount: $${(data.amount / 100).toFixed(2)}`,
        });
      }
    }

    res.status(201).json({ billing_alert: data });
  })
);

// Update a billing alert
router.put(
  "/:id",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { data, error } = await supabase
      .from("billing_alerts")
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw new AppError(500, error.message);
    res.json({ billing_alert: data });
  })
);

// Delete a billing alert
router.delete(
  "/:id",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { error } = await supabase
      .from("billing_alerts")
      .delete()
      .eq("id", req.params.id);

    if (error) throw new AppError(500, error.message);
    res.json({ message: "Billing alert deleted successfully" });
  })
);

export default router;

import { Router, Response } from "express";
import { body, validationResult } from "express-validator";
import { supabase } from "../config/database";
import { authenticate, AuthRequest } from "../middleware/auth";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { Dispute } from "../types";
import { logToNotion } from "../services/notion";

const router = Router();

// Get all disputes
router.get(
  "/",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { status } = req.query;
    let query = supabase.from("disputes").select("*");

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw new AppError(500, error.message);
    res.json({ disputes: data });
  })
);

// Get a single dispute
router.get(
  "/:id",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { data, error } = await supabase
      .from("disputes")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) throw new AppError(404, "Dispute not found");
    res.json({ dispute: data });
  })
);

// Create a dispute
router.post(
  "/",
  authenticate,
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("priority")
      .isIn(["low", "medium", "high", "critical"])
      .withMessage("Invalid priority level"),
  ],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(400, errors.array()[0].msg);
    }

    const dispute: Dispute = {
      ...req.body,
      status: req.body.status || "open",
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("disputes")
      .insert([dispute])
      .select()
      .single();

    if (error) throw new AppError(500, error.message);

    // Log to Notion
    await logToNotion({
      title: `Dispute: ${data.title}`,
      details: `Priority: ${data.priority} | ${data.description}`,
      type: "dispute",
    });

    res.status(201).json({ dispute: data });
  })
);

// Update a dispute
router.put(
  "/:id",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const updates: any = {
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    // If status is being set to resolved, add resolved_at timestamp
    if (req.body.status === "resolved" || req.body.status === "closed") {
      updates.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("disputes")
      .update(updates)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw new AppError(500, error.message);
    res.json({ dispute: data });
  })
);

// Delete a dispute
router.delete(
  "/:id",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { error } = await supabase
      .from("disputes")
      .delete()
      .eq("id", req.params.id);

    if (error) throw new AppError(500, error.message);
    res.json({ message: "Dispute deleted successfully" });
  })
);

export default router;

import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { BillingAlert } from "../models/types";

export const getAllBillingAlerts = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("billing_alerts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBillingAlertById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("billing_alerts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createBillingAlert = async (req: Request, res: Response) => {
  try {
    const billingAlert: BillingAlert = req.body;
    const { data, error } = await supabase
      .from("billing_alerts")
      .insert([billingAlert])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateBillingAlert = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates: Partial<BillingAlert> = req.body;
    const { data, error } = await supabase
      .from("billing_alerts")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteBillingAlert = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from("billing_alerts")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({ success: true, message: "Billing alert deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

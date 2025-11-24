import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { Beneficiary } from "../models/types";

export const getAllBeneficiaries = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("beneficiaries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBeneficiaryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("beneficiaries")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createBeneficiary = async (req: Request, res: Response) => {
  try {
    const beneficiary: Beneficiary = req.body;
    const { data, error } = await supabase
      .from("beneficiaries")
      .insert([beneficiary])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateBeneficiary = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates: Partial<Beneficiary> = req.body;
    const { data, error } = await supabase
      .from("beneficiaries")
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

export const deleteBeneficiary = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from("beneficiaries")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({ success: true, message: "Beneficiary deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

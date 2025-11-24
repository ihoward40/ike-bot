import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { Dispute } from "../models/types";

export const getAllDisputes = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("disputes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getDisputeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("disputes")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createDispute = async (req: Request, res: Response) => {
  try {
    const dispute: Dispute = req.body;
    const { data, error } = await supabase
      .from("disputes")
      .insert([dispute])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateDispute = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates: Partial<Dispute> = req.body;
    const { data, error } = await supabase
      .from("disputes")
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

export const deleteDispute = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from("disputes")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({ success: true, message: "Dispute deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

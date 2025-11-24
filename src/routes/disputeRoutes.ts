import { Router } from "express";
import {
  getAllDisputes,
  getDisputeById,
  createDispute,
  updateDispute,
  deleteDispute,
} from "../controllers/disputeController";

const router = Router();

router.get("/", getAllDisputes);
router.get("/:id", getDisputeById);
router.post("/", createDispute);
router.put("/:id", updateDispute);
router.delete("/:id", deleteDispute);

export default router;

import { Router } from "express";
import {
  getAllBillingAlerts,
  getBillingAlertById,
  createBillingAlert,
  updateBillingAlert,
  deleteBillingAlert,
} from "../controllers/billingAlertController";

const router = Router();

router.get("/", getAllBillingAlerts);
router.get("/:id", getBillingAlertById);
router.post("/", createBillingAlert);
router.put("/:id", updateBillingAlert);
router.delete("/:id", deleteBillingAlert);

export default router;

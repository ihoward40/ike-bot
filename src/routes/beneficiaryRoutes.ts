import { Router } from "express";
import {
  getAllBeneficiaries,
  getBeneficiaryById,
  createBeneficiary,
  updateBeneficiary,
  deleteBeneficiary,
} from "../controllers/beneficiaryController";

const router = Router();

router.get("/", getAllBeneficiaries);
router.get("/:id", getBeneficiaryById);
router.post("/", createBeneficiary);
router.put("/:id", updateBeneficiary);
router.delete("/:id", deleteBeneficiary);

export default router;

import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { register, login } from "../services/auth";
import { asyncHandler, AppError } from "../middleware/errorHandler";

const router = Router();

router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("name").optional().isString(),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(400, errors.array()[0].msg);
    }

    const result = await register(req.body);
    res.status(201).json(result);
  })
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(400, errors.array()[0].msg);
    }

    const result = await login(req.body);
    res.json(result);
  })
);

export default router;

import { Response } from 'express';
import { AuthRequest } from '../types';
import authService from '../services/authService';
import { asyncHandler } from '../middleware/errorHandler';

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      error: 'Email and password are required',
    });
    return;
  }

  const result = await authService.register(email, password);

  res.status(201).json({
    success: true,
    data: result,
    message: 'User registered successfully',
  });
});

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      error: 'Email and password are required',
    });
    return;
  }

  const result = await authService.login(email, password);

  res.status(200).json({
    success: true,
    data: result,
    message: 'Login successful',
  });
});

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Not authenticated',
    });
    return;
  }

  const user = await authService.getUserById(req.user.id);

  if (!user) {
    res.status(404).json({
      success: false,
      error: 'User not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

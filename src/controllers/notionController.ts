import { Response } from 'express';
import { AuthRequest } from '../types';
import notionService from '../services/notionService';
import { asyncHandler } from '../middleware/errorHandler';

export const logActivity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, status, type, description, metadata } = req.body;

  if (!title || !status || !type) {
    res.status(400).json({
      success: false,
      error: 'title, status, and type are required',
    });
    return;
  }

  const result = await notionService.logActivity({
    title,
    status,
    type,
    description,
    metadata,
  });

  res.status(201).json({
    success: true,
    data: result,
    message: 'Activity logged successfully',
  });
});

export const createFiling = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, type, status, content } = req.body;

  if (!title || !type) {
    res.status(400).json({
      success: false,
      error: 'title and type are required',
    });
    return;
  }

  const result = await notionService.createFiling({
    title,
    type,
    status: status || 'Draft',
    content,
  });

  res.status(201).json({
    success: true,
    data: result,
    message: 'Filing created successfully',
  });
});

export const getDatabase = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { databaseId } = req.params;

  if (!databaseId) {
    res.status(400).json({
      success: false,
      error: 'databaseId is required',
    });
    return;
  }

  const result = await notionService.getDatabase(databaseId);

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const updatePage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { pageId } = req.params;
  const { properties } = req.body;

  if (!pageId || !properties) {
    res.status(400).json({
      success: false,
      error: 'pageId and properties are required',
    });
    return;
  }

  const result = await notionService.updatePage(pageId, properties);

  res.status(200).json({
    success: true,
    data: result,
    message: 'Page updated successfully',
  });
});

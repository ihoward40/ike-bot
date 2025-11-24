import { Response } from 'express';
import { AuthRequest } from '../types';
import CrudService from '../services/crudService';
import { asyncHandler } from '../middleware/errorHandler';

export const createCrudController = (tableName: string) => {
  const crudService = new CrudService(tableName);

  return {
    create: asyncHandler(async (req: AuthRequest, res: Response) => {
      const data = req.body;

      // Add user_id if authenticated
      if (req.user) {
        data.user_id = req.user.id;
      }

      const result = await crudService.create(data);

      res.status(201).json({
        success: true,
        data: result,
        message: `${tableName} created successfully`,
      });
    }),

    findById: asyncHandler(async (req: AuthRequest, res: Response) => {
      const { id } = req.params;

      const result = await crudService.findById(id);

      res.status(200).json({
        success: true,
        data: result,
      });
    }),

    findAll: asyncHandler(async (req: AuthRequest, res: Response) => {
      const { limit = 100, offset = 0, ...filters } = req.query;

      const result = await crudService.findAll(
        filters as Record<string, any>,
        Number(limit),
        Number(offset)
      );

      res.status(200).json({
        success: true,
        data: result,
        count: result.length,
      });
    }),

    update: asyncHandler(async (req: AuthRequest, res: Response) => {
      const { id } = req.params;
      const data = req.body;

      const result = await crudService.update(id, data);

      res.status(200).json({
        success: true,
        data: result,
        message: `${tableName} updated successfully`,
      });
    }),

    delete: asyncHandler(async (req: AuthRequest, res: Response) => {
      const { id } = req.params;

      await crudService.delete(id);

      res.status(200).json({
        success: true,
        message: `${tableName} deleted successfully`,
      });
    }),
  };
};

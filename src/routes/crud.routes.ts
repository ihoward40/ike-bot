import { Router } from 'express';
import { createCrudController } from '../controllers/crudController';
import { authenticateToken } from '../middleware/auth';

export const createCrudRoutes = (tableName: string, requireAuth: boolean = true) => {
  const router = Router();
  const controller = createCrudController(tableName);

  // Apply authentication middleware if required
  if (requireAuth) {
    router.use(authenticateToken);
  }

  router.post('/', controller.create);
  router.get('/', controller.findAll);
  router.get('/:id', controller.findById);
  router.put('/:id', controller.update);
  router.patch('/:id', controller.update);
  router.delete('/:id', controller.delete);

  return router;
};

export default createCrudRoutes;

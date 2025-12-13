import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as enforcementPacketController from '../controllers/enforcementPacket.controller';

const router = Router();

router.get('/', asyncHandler(enforcementPacketController.listEnforcementPackets));
router.get('/:id', asyncHandler(enforcementPacketController.getEnforcementPacket));
router.post('/', asyncHandler(enforcementPacketController.createEnforcementPacket));
router.put('/:id', asyncHandler(enforcementPacketController.updateEnforcementPacket));
router.delete('/:id', asyncHandler(enforcementPacketController.deleteEnforcementPacket));

export default router;

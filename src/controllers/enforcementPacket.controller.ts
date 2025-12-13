import { Request, Response } from 'express';
import { EnforcementPacketService } from '../services/enforcementPacket.service';
import { 
  createEnforcementPacketSchema, 
  updateEnforcementPacketSchema, 
  listEnforcementPacketsQuerySchema 
} from '../models/enforcementPacket.schema';

const enforcementPacketService = new EnforcementPacketService();

export const listEnforcementPackets = async (req: Request, res: Response) => {
  const query = listEnforcementPacketsQuerySchema.parse(req.query);
  const result = await enforcementPacketService.list(query);
  res.json(result);
};

export const getEnforcementPacket = async (req: Request, res: Response) => {
  const { id } = req.params;
  const packet = await enforcementPacketService.getById(id);
  res.json(packet);
};

export const createEnforcementPacket = async (req: Request, res: Response) => {
  const input = createEnforcementPacketSchema.parse(req.body);
  const packet = await enforcementPacketService.create(input);
  res.status(201).json(packet);
};

export const updateEnforcementPacket = async (req: Request, res: Response) => {
  const { id } = req.params;
  const input = updateEnforcementPacketSchema.parse(req.body);
  const packet = await enforcementPacketService.update(id, input);
  res.json(packet);
};

export const deleteEnforcementPacket = async (req: Request, res: Response) => {
  const { id } = req.params;
  await enforcementPacketService.delete(id);
  res.status(204).send();
};

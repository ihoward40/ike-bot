import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface MakeWebhookPayload {
  event: string;
  data: any;
  timestamp?: string;
}

export interface NotionLogEntry {
  title: string;
  status: string;
  type: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface User {
  id: string;
  email: string;
  password?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Filing {
  id: string;
  user_id: string;
  type: string;
  status: string;
  content: any;
  created_at?: string;
  updated_at?: string;
}

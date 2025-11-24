import jwt from "jsonwebtoken";
import type { StringValue } from "ms";
import bcrypt from "bcrypt";
import { config } from "../config";
import { supabase } from "../config/database";
import { logger } from "../middleware/logger";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

export interface TokenPayload {
  id: string;
  email: string;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as StringValue,
  });
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const register = async (data: RegisterData) => {
  try {
    const hashedPassword = await hashPassword(data.password);

    // Use Supabase auth or custom users table
    const { data: user, error } = await supabase
      .from("users")
      .insert([
        {
          email: data.email,
          password: hashedPassword,
          name: data.name,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    const token = generateToken({ id: user.id, email: user.email });

    logger.info(`User registered: ${user.email}`);
    return { user: { id: user.id, email: user.email, name: user.name }, token };
  } catch (error: any) {
    logger.error("Registration failed", error);
    throw new Error(`Registration failed: ${error.message}`);
  }
};

export const login = async (credentials: LoginCredentials) => {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", credentials.email)
      .single();

    if (error || !user) {
      throw new Error("Invalid credentials");
    }

    const isValid = await comparePassword(credentials.password, user.password);
    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    const token = generateToken({ id: user.id, email: user.email });

    logger.info(`User logged in: ${user.email}`);
    return { user: { id: user.id, email: user.email, name: user.name }, token };
  } catch (error: any) {
    logger.error("Login failed", error);
    throw new Error("Invalid credentials");
  }
};

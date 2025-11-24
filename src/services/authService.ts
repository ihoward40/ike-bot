import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../config/supabase';
import config from '../config';
import { User } from '../types';

export class AuthService {
  async register(email: string, password: string): Promise<{ user: User; token: string }> {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in Supabase
    const { data, error } = await supabase
      .from('users')
      .insert([{ email, password: hashedPassword, role: 'user' }])
      .select()
      .single();

    if (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: data.id, email: data.email, role: data.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = data;

    return { user: userWithoutPassword as User, token };
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    // Find user
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, data.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: data.id, email: data.email, role: data.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = data;

    return { user: userWithoutPassword as User, token };
  }

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) {
      return null;
    }

    return data as User;
  }
}

export default new AuthService();

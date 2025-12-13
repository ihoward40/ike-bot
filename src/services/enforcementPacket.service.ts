import { supabase } from '../config/supabase';
import { 
  CreateEnforcementPacketInput, 
  UpdateEnforcementPacketInput, 
  ListEnforcementPacketsQuery 
} from '../models/enforcementPacket.schema';
import { AppError } from '../middleware/errorHandler';

export class EnforcementPacketService {
  async list(query: ListEnforcementPacketsQuery) {
    const { page, limit, sortBy, sortOrder, status, beneficiary_id, packet_type } = query;
    const offset = (page - 1) * limit;

    let queryBuilder = supabase
      .from('enforcement_packets')
      .select('*', { count: 'exact' });

    if (status) {
      queryBuilder = queryBuilder.eq('status', status);
    }

    if (beneficiary_id) {
      queryBuilder = queryBuilder.eq('beneficiary_id', beneficiary_id);
    }

    if (packet_type) {
      queryBuilder = queryBuilder.eq('packet_type', packet_type);
    }

    const { data, error, count } = await queryBuilder
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new AppError(500, `Failed to fetch enforcement packets: ${error.message}`);
    }

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  }

  async getById(id: string) {
    const { data, error } = await supabase
      .from('enforcement_packets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new AppError(404, 'Enforcement packet not found');
      }
      throw new AppError(500, `Failed to fetch enforcement packet: ${error.message}`);
    }

    return data;
  }

  async create(input: CreateEnforcementPacketInput) {
    // Verify beneficiary exists
    const { data: beneficiary, error: beneficiaryError } = await supabase
      .from('beneficiaries')
      .select('id')
      .eq('id', input.beneficiary_id)
      .single();

    if (beneficiaryError || !beneficiary) {
      throw new AppError(404, 'Beneficiary not found');
    }

    const { data, error } = await supabase
      .from('enforcement_packets')
      .insert(input)
      .select()
      .single();

    if (error) {
      throw new AppError(500, `Failed to create enforcement packet: ${error.message}`);
    }

    return data;
  }

  async update(id: string, input: UpdateEnforcementPacketInput) {
    const { data, error } = await supabase
      .from('enforcement_packets')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new AppError(404, 'Enforcement packet not found');
      }
      throw new AppError(500, `Failed to update enforcement packet: ${error.message}`);
    }

    return data;
  }

  async delete(id: string) {
    const { error } = await supabase
      .from('enforcement_packets')
      .delete()
      .eq('id', id);

    if (error) {
      throw new AppError(500, `Failed to delete enforcement packet: ${error.message}`);
    }

    return { success: true };
  }
}

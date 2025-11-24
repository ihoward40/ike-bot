import supabase from '../config/supabase';

export class CrudService {
  private tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  async create(data: any) {
    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert([data])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create record: ${error.message}`);
    }

    return result;
  }

  async findById(id: string) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to find record: ${error.message}`);
    }

    return data;
  }

  async findAll(filters: Record<string, any> = {}, limit: number = 100, offset: number = 0) {
    let query = supabase.from(this.tableName).select('*');

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch records: ${error.message}`);
    }

    return data;
  }

  async update(id: string, data: any) {
    const { data: result, error } = await supabase
      .from(this.tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update record: ${error.message}`);
    }

    return result;
  }

  async delete(id: string) {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete record: ${error.message}`);
    }

    return { success: true };
  }
}

export default CrudService;

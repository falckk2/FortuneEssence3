import { SupabaseClient } from '@supabase/supabase-js';
import { ApiResponse } from '$lib/types';

export abstract class BaseRepository<T> {
  protected abstract readonly tableName: string;
  protected abstract transformDbRecord(record: any): T;

  constructor(protected readonly supabase: SupabaseClient) {}

  async findById(id: string, notFoundMessage = 'Record not found'): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: notFoundMessage };
        }
        return { success: false, error: error.message };
      }

      return { success: true, data: this.transformDbRecord(data) };
    } catch (error) {
      return { success: false, error: `Failed to find record: ${error}` };
    }
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: `Failed to delete record: ${error}` };
    }
  }

  protected async executeCreate(insertData: Record<string, any>): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert(insertData)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: this.transformDbRecord(data) };
    } catch (error) {
      return { success: false, error: `Failed to create record: ${error}` };
    }
  }

  protected async executeUpdate(id: string, updateData: Record<string, any>): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: 'Record not found' };
      }

      return { success: true, data: this.transformDbRecord(data) };
    } catch (error) {
      return { success: false, error: `Failed to update record: ${error}` };
    }
  }
}

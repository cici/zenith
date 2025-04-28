import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Define types
export interface ApiKey {
  id: string;
  integration_name: string;
  api_key: string;
  api_secret?: string;
  additional_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface ApiKeyInput {
  integration_name: string;
  api_key: string;
  api_secret?: string;
  additional_data?: Record<string, any>;
  is_active?: boolean;
}

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class ApiKeyService {
  private client: SupabaseClient;

  constructor(client: SupabaseClient = supabase) {
    this.client = client;
  }

  /**
   * Get all API keys
   */
  async getAllApiKeys(): Promise<ApiKey[]> {
    const { data, error } = await this.client
      .from("api_keys")
      .select("*")
      .order("integration_name", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get API key by integration name
   */
  async getApiKeyByIntegration(
    integrationName: string
  ): Promise<ApiKey | null> {
    const { data, error } = await this.client
      .from("api_keys")
      .select("*")
      .eq("integration_name", integrationName)
      .eq("is_active", true)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 is "no rows returned"
    return data;
  }

  /**
   * Create or update API key
   */
  async upsertApiKey(apiKeyData: ApiKeyInput): Promise<ApiKey> {
    const { data, error } = await this.client
      .from("api_keys")
      .upsert([apiKeyData], {
        onConflict: "integration_name",
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete API key
   */
  async deleteApiKey(id: string): Promise<void> {
    const { error } = await this.client.from("api_keys").delete().eq("id", id);

    if (error) throw error;
  }

  /**
   * Deactivate API key
   */
  async deactivateApiKey(integrationName: string): Promise<void> {
    const { error } = await this.client
      .from("api_keys")
      .update({ is_active: false })
      .eq("integration_name", integrationName);

    if (error) throw error;
  }
}

// Export singleton instance
export const apiKeyService = new ApiKeyService();

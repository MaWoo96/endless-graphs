// Database types for Endless Winning Supabase

export interface Client {
  id: string;
  user_id: string | null;
  business_name: string;
  entity_type: string | null;
  ein: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  company_name: string | null;
  industry: string | null;
  role: string | null;
  team_size: string | null;
  monthly_revenue: string | null;
  goals: Record<string, unknown> | null;
  challenges: Record<string, unknown> | null;
  airtable_base_id: string | null;
  industry_profile_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Transaction {
  id: string;
  plaid_transaction_id: string;
  client_id: string | null;
  entity_id: string | null;
  tenant_id: string | null;
  user_id: string | null;
  plaid_item_id: string | null;
  account_id: string;
  amount: number;
  iso_currency_code: string | null;
  date: string;
  authorized_date: string | null;
  merchant_name: string | null;
  name: string | null;
  category: string[] | null;
  pending: boolean | null;
  payment_channel: string | null;
  transaction_type: string | null;
  airtable_record_id: string | null;
  sync_status: string | null;
  sync_error: string | null;
  raw_data: Record<string, unknown> | null;
  institution_name: string | null;
  coa_keywords: string | null;
  coa_account: string | null;
  categorization_source: string | null;
  categorization_confidence: number | null;
  categorized_at: string | null;
  mcc_code: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Plaid enrichment fields
  is_removed: boolean | null;
  removed_at: string | null;
  pfc_primary: string | null;
  pfc_detailed: string | null;
  pfc_confidence: string | null;
  pfc_icon_url: string | null;
  merchant_logo_url: string | null;
  merchant_website: string | null;
  merchant_entity_id: string | null;
  counterparties: Record<string, unknown> | null;
  // Location fields
  location_address: string | null;
  location_city: string | null;
  location_region: string | null;
  location_postal_code: string | null;
  location_country: string | null;
  location_lat: number | null;
  location_lon: number | null;
  location_store_number: string | null;
  // Review fields for client feedback
  review_status: "flagged" | "approved" | "rejected" | null;
  review_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface PlaidItem {
  id: string;
  client_id: string | null;
  access_token: string;
  item_id: string;
  institution_id: string | null;
  institution_name: string | null;
  cursor: string | null;
  last_sync_at: string | null;
  status: string | null;
  error_message: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Account {
  id: string;
  plaid_item_id: string;
  entity_id: string | null;
  tenant_id: string;
  plaid_account_id: string;
  name: string;
  official_name: string | null;
  mask: string | null;
  type: 'depository' | 'credit' | 'loan' | 'investment' | 'other';
  subtype: string | null;
  display_name: string | null;
  is_active: boolean;
  balance_available: number | null;
  balance_current: number | null;
  balance_limit: number | null;
  balance_currency: string | null;
  balance_updated_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Joined fields from related tables
  institution_name?: string | null;
}

// Aggregated data types for charts
export interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  [key: string]: string | number;
}

export interface CashFlowData {
  month: string;
  inflow: number;
  outflow: number;
  net: number;
}

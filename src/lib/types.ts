export type PaymentTerms = "COD" | "14 days" | "30 days" | "60 days";

export type QuoteStatus =
  | "Quoted"
  | "Closed Won"
  | "Closed Lost"
  | "Checking With Supplier"
  | "Part Number Issue"
  | "Not Found";

export type FollowUpOffset = 3 | 7 | 14 | 21;

export interface QuoteRow {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_number: string | null;
  rfq_date: string | null;
  quote_sent_date: string | null;
  quote_value_sgd: number;
  profit_sgd: number;
  brand_description: string | null;
  payment_terms: PaymentTerms;
  status: QuoteStatus;
  created_at: string;
  updated_at: string;
}

export interface FollowUpRow {
  id: string;
  quote_id: string;
  day_offset: FollowUpOffset;
  follow_up_date: string;
}

export interface NoteRow {
  id: string;
  quote_id: string;
  body: string;
  created_at: string;
}

export interface QuoteWithRelations extends QuoteRow {
  follow_ups: FollowUpRow[];
  notes: NoteRow[];
}

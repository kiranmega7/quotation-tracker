import type { PaymentTerms, QuoteStatus } from "./types";

export const PAYMENT_TERMS: PaymentTerms[] = ["COD", "14 days", "30 days", "60 days"];

export const QUOTE_STATUSES: QuoteStatus[] = [
  "Quoted",
  "Closed Won",
  "Closed Lost",
  "Checking With Supplier",
  "Part Number Issue",
  "Not Found",
];

/** Table filter uses shortened label for supplier check */
export const STATUS_FILTER_LABELS: Record<QuoteStatus, string> = {
  Quoted: "Quoted",
  "Closed Won": "Closed Won",
  "Closed Lost": "Closed Lost",
  "Checking With Supplier": "Checking",
  "Part Number Issue": "Part Number Issue",
  "Not Found": "Not Found",
};

export const OPEN_STATUSES: QuoteStatus[] = [
  "Quoted",
  "Checking With Supplier",
  "Part Number Issue",
  "Not Found",
];

export const CLOSED_STATUSES: QuoteStatus[] = ["Closed Won", "Closed Lost"];

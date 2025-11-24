export interface Beneficiary {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  relationship: string;
  trust_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TrustNotice {
  id?: string;
  title: string;
  description: string;
  notice_type: string;
  status: "pending" | "sent" | "acknowledged" | "expired";
  beneficiary_id?: string;
  due_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Dispute {
  id?: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  beneficiary_id?: string;
  resolution?: string;
  created_at?: string;
  updated_at?: string;
  resolved_at?: string;
}

export interface BillingAlert {
  id?: string;
  title: string;
  description: string;
  amount: number;
  alert_type: "payment_due" | "overdue" | "payment_received" | "refund";
  status: "active" | "resolved" | "dismissed";
  beneficiary_id?: string;
  due_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WebhookEvent {
  id?: string;
  event_type: string;
  payload: any;
  source: string;
  processed: boolean;
  created_at?: string;
}

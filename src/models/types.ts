export interface Beneficiary {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  relationship: string;
  trust_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface Dispute {
  id?: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  trust_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface BillingAlert {
  id?: string;
  amount: number;
  due_date: string;
  description: string;
  status: "pending" | "paid" | "overdue" | "cancelled";
  trust_id: string;
  created_at?: string;
  updated_at?: string;
}

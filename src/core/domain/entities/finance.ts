export interface AuditLog {
    id: string;
    user_id: string;
    event_type: 'TX_CREATED' | 'TX_DELETED' | 'AUTH_FAILURE' | 'BALANCE_INCONSISTENCY';
    metadata: any;
    severity: 'info' | 'warning' | 'error' | 'critical';
    created_at: string;
}

export interface Transaction {
    id: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    date: string;
    category_id: string;
    wallet_id: string;
    payment_method: string;
    status: 'completed' | 'pending';
    is_recurring: boolean;
    recurrence_interval?: string;
    destination_wallet_id?: string;
    category?: { name: string };
    wallet?: { name: string };
    created_at?: string;
}

export interface Wallet {
    id: string;
    name: string;
    balance: number;
    user_id: string;
    deleted_at?: string;
}

export interface Category {
    id: string;
    name: string;
    type: 'income' | 'expense';
    user_id: string;
    icon?: string;
    color?: string;
}

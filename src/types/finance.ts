export type TransactionType = 'income' | 'expense';
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Category {
    id: string;
    user_id: string;
    name: string;
    type: TransactionType;
    icon?: string;
    color?: string;
    created_at: string;
}

export interface Wallet {
    id: string;
    user_id: string;
    name: string;
    type: string;
    balance: number;
    color: string;
    card_type?: 'credit' | 'debit' | null;
    card_number?: string | null;
    card_limit?: number | null;
    created_at: string;
}

export interface Transaction {
    id: string;
    user_id: string;
    wallet_id: string;
    category_id: string;
    amount: number;
    type: TransactionType;
    description: string;
    date: string;
    status: 'pending' | 'completed';
    created_at: string;
    category?: { name: string };
    wallet?: { name: string };
}

export interface Goal {
    id: string;
    user_id: string;
    name: string;
    target_amount: number;
    current_amount: number;
    deadline?: string;
    color?: string;
    icon?: string;
    created_at: string;
}

import { z } from "zod";

export const transactionSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid().optional(),
    description: z.string().min(1, "Descrição é obrigatória"),
    amount: z.number().positive("O valor deve ser positivo"),
    type: z.enum(["income", "expense"]),
    date: z.string().or(z.date()),
    category_id: z.string().uuid().nullable().optional(),
    wallet_id: z.string().uuid(),
    payment_method: z.string().optional(),
    status: z.enum(["completed", "pending"]).default("completed"),
    is_recurring: z.boolean().default(false),
    recurrence_interval: z.string().optional().nullable(),
    deleted_at: z.string().or(z.date()).nullable().optional(),
    created_at: z.string().or(z.date()).optional(),
    category: z.object({
        name: z.string(),
    }).optional(),
    wallet: z.object({
        name: z.string(),
    }).optional(),
});

export const walletSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid().optional(),
    name: z.string().min(1, "Nome da carteira é obrigatório"),
    balance: z.number().default(0),
    type: z.string().optional().nullable(),
    color: z.string().optional().nullable(),
    deleted_at: z.string().or(z.date()).nullable().optional(),
    created_at: z.string().or(z.date()).optional(),
});

export const categorySchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    icon: z.string().optional().nullable(),
    color: z.string().optional().nullable(),
    type: z.enum(["income", "expense"]),
    user_id: z.string().uuid().optional(),
});

export const importedTransactionSchema = z.object({
    id: z.string().optional(),
    description: z.string().min(1),
    amount: z.number(),
    date: z.string(),
    type: z.enum(["income", "expense"]),
    fitid: z.string().optional().nullable(),
});

export type Transaction = z.infer<typeof transactionSchema>;
export type Wallet = z.infer<typeof walletSchema>;
export type Category = z.infer<typeof categorySchema>;
export type ImportedTransaction = z.infer<typeof importedTransactionSchema>;

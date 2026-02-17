-- MIGRAÇÃO DE ARQUITETURA PREMIUM - SISTEMA FINANCEIRO --

-- 1. ATIVAÇÃO DE RLS (ROW LEVEL SECURITY)
ALTER TABLE IF EXISTS public.wallet_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS DE ACESSO (PROTEÇÃO ABSOLUTA POR USER_ID)
DO $$ 
BEGIN
    -- Wallet Types
    DROP POLICY IF EXISTS "Users can only access their own wallet types" ON public.wallet_types;
    CREATE POLICY "Users can only access their own wallet types" ON public.wallet_types
        FOR ALL USING (auth.uid() = user_id);

    -- Wallets
    DROP POLICY IF EXISTS "Users can only access their own wallets" ON public.wallets;
    CREATE POLICY "Users can only access their own wallets" ON public.wallets
        FOR ALL USING (auth.uid() = user_id);

    -- Categories
    DROP POLICY IF EXISTS "Users can only access their own categories" ON public.categories;
    CREATE POLICY "Users can only access their own categories" ON public.categories
        FOR ALL USING (auth.uid() = user_id);

    -- Transactions
    DROP POLICY IF EXISTS "Users can only access their own transactions" ON public.transactions;
    CREATE POLICY "Users can only access their own transactions" ON public.transactions
        FOR ALL USING (auth.uid() = user_id);
END $$;

-- 3. AUTOMAÇÃO DE SALDO (PREVENÇÃO DE EDIÇÃO MANUAL)
-- Nota: O saldo da carteira deve ser SEMPRE a soma das transações completadas.

CREATE OR REPLACE FUNCTION public.update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.wallets 
        SET balance = CASE 
            WHEN NEW.type = 'income' THEN balance + NEW.amount
            ELSE balance - NEW.amount
        END
        WHERE id = NEW.wallet_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.wallets 
        SET balance = CASE 
            WHEN OLD.type = 'income' THEN balance - OLD.amount
            ELSE balance + OLD.amount
        END
        WHERE id = OLD.wallet_id;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Reverte o antigo
        UPDATE public.wallets 
        SET balance = CASE 
            WHEN OLD.type = 'income' THEN balance - OLD.amount
            ELSE balance + OLD.amount
        END
        WHERE id = OLD.wallet_id;
        -- Aplica o novo
        UPDATE public.wallets 
        SET balance = CASE 
            WHEN NEW.type = 'income' THEN balance + NEW.amount
            ELSE balance - NEW.amount
        END
        WHERE id = NEW.wallet_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_wallet_balance ON public.transactions;
CREATE TRIGGER tr_update_wallet_balance
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.update_wallet_balance();

-- 4. NOVAS ESTRUTURAS (RECORRÊNCIA E METAS)

CREATE TABLE IF NOT EXISTS public.recurrences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    type TEXT CHECK (type IN ('income', 'expense')),
    frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    start_date DATE NOT NULL,
    next_date DATE NOT NULL,
    wallet_id UUID REFERENCES public.wallets(id),
    category_id UUID REFERENCES public.categories(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    name TEXT NOT NULL,
    target_amount NUMERIC NOT NULL,
    current_amount NUMERIC DEFAULT 0,
    deadline DATE,
    color TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.recurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own recurrences" ON public.recurrences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own goals" ON public.goals FOR ALL USING (auth.uid() = user_id);

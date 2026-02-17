-- ENTERPRISE FINANCIAL ARCHITECTURE MIGRATION

-- 1. ESTRUTURA DE AUDITORIA
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL, -- TX_CREATED, TX_DELETED, AUTH_FAILURE, BALANCE_INCONSISTENCY
    metadata JSONB DEFAULT '{}',
    severity TEXT DEFAULT 'info', -- info, warning, error, critical
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own audit logs" ON audit_events
    FOR SELECT USING (auth.uid() = user_id);

-- 2. SOFT DELETE E CONSTRAINTS DE SEGURANÇA
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Proteção de saldo negativo (Regra de Ouro)
ALTER TABLE wallets ADD CONSTRAINT check_positive_balance CHECK (balance >= 0);

-- 3. ATUALIZAÇÃO DE RLS PARA SOFT DELETE
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can view their own wallets" ON wallets;
CREATE POLICY "Users can view their own wallets" ON wallets
    FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

-- 4. RPC: ATOMIC TRANSACTION CREATION
-- Esta função garante que a transação e o saldo sejam atualizados em um único bloco atômico.
CREATE OR REPLACE FUNCTION create_financial_transaction(
    p_description TEXT,
    p_amount DECIMAL,
    p_type TEXT,
    p_date TIMESTAMPTZ,
    p_category_id UUID,
    p_wallet_id UUID,
    p_payment_method TEXT,
    p_status TEXT,
    p_is_recurring BOOLEAN DEFAULT FALSE,
    p_recurrence_interval TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_new_tx_id UUID;
    v_current_balance DECIMAL;
BEGIN
    v_user_id := auth.uid();
    
    -- 1. Bloqueio pessimista para evitar race conditions
    SELECT balance INTO v_current_balance 
    FROM wallets 
    WHERE id = p_wallet_id AND user_id = v_user_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wallet not found or access denied';
    END IF;

    -- 2. Inserir a transação
    INSERT INTO transactions (
        user_id, description, amount, type, date, category_id, 
        wallet_id, payment_method, status, is_recurring, recurrence_interval
    ) VALUES (
        v_user_id, p_description, p_amount, p_type, p_date, p_category_id, 
        p_wallet_id, p_payment_method, p_status, p_is_recurring, p_recurrence_interval
    ) RETURNING id INTO v_new_tx_id;

    -- 3. O trigger já cuida da atualização do saldo, mas aqui o banco agora valida o CHECK (balance >= 0)
    -- Se o trigger tentar deixar o saldo negativo, esta transação sofrerá rollback automático.

    -- 4. Log de auditoria
    INSERT INTO audit_events (user_id, event_type, metadata)
    VALUES (v_user_id, 'TX_CREATED', jsonb_build_object(
        'transaction_id', v_new_tx_id,
        'amount', p_amount,
        'wallet_id', p_wallet_id
    ));

    RETURN jsonb_build_object('success', true, 'id', v_new_tx_id);
EXCEPTION WHEN OTHERS THEN
    -- Log de erro/inconsistência se necessário (dependendo do tipo de erro)
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC: ATOMIC SOFT DELETE
CREATE OR REPLACE FUNCTION delete_financial_transaction(p_tx_id UUID) 
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_wallet_id UUID;
BEGIN
    v_user_id := auth.uid();

    -- Soft delete
    UPDATE transactions 
    SET deleted_at = now() 
    WHERE id = p_tx_id AND user_id = v_user_id
    RETURNING wallet_id INTO v_wallet_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Transaction not found');
    END IF;

    -- Log de auditoria
    INSERT INTO audit_events (user_id, event_type, metadata)
    VALUES (v_user_id, 'TX_DELETED', jsonb_build_object('transaction_id', p_tx_id));

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

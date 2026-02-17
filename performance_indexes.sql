-- PERFORMANCE INDEXES (Resultados da Auditoria v1.0)

-- 1. Índice Composto para Histórico (Filtro por User + Ordenação por Data)
-- Acelera: Dashboard, Extratos e Listagem Geral
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);

-- 2. Índice para Filtro por Carteira (Foreign Key não indexada automaticamente)
-- Acelera: Detalhes da Carteira e Cálculo de Saldo
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON public.transactions(wallet_id);

-- 3. Índice para Filtro por Categoria (Relatórios)
-- Acelera: Gráficos de Despesas por Categoria
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category_id);

-- 4. Índice para Soft Deletes (Otimiza a cláusula "deleted_at IS NULL")
-- Acelera: Todas as queries do sistema (pois todas usam esse filtro)
CREATE INDEX IF NOT EXISTS idx_transactions_deleted_at ON public.transactions(deleted_at) WHERE deleted_at IS NULL;

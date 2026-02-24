"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { services } from "@/core/application/services/services.factory";
import { ImportedTransaction } from "@/lib/validations";
import { toast } from "sonner";
import { FileUp, AlertCircle, Loader2, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

async function extractTextFromPDF(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/pdf-import", {
        method: "POST",
        body: formData,
    });

    let errMessage = "Erro ao processar PDF no servidor";
    if (!response.ok) {
        try {
            const text = await response.text();
            if (!text.startsWith("<")) {
                const json = JSON.parse(text);
                errMessage = json.error || errMessage;
            } else {
                errMessage = "O servidor travou ao tentar ler o PDF.";
            }
        } catch { /* ignore */ }
        throw new Error(errMessage);
    }

    const result = await response.json();
    return result.text as string;
}

interface WalletOption { id: string; name: string; balance: number; }

export function ImportTransactionsModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ImportedTransaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);

    // Wallet selector state
    const [wallets, setWallets] = useState<WalletOption[]>([]);
    const [selectedWalletId, setSelectedWalletId] = useState<string>("");

    // Load wallets when modal opens
    useEffect(() => {
        if (!isOpen) return;
        services.wallets.getUserWallets().then((ws) => {
            const mapped = ws.map((w) => ({ id: w.id, name: w.name, balance: w.balance ?? 0 }));
            setWallets(mapped);
            if (mapped.length > 0 && !selectedWalletId) {
                setSelectedWalletId(mapped[0].id);
            }
        }).catch(() => toast.error("Erro ao carregar carteiras."));
    }, [isOpen, selectedWalletId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setParsedData([]);
        }
    };

    const handlePreview = async () => {
        if (!file) return;
        if (!selectedWalletId) {
            toast.error("Selecione uma carteira antes de continuar.");
            return;
        }
        setLoading(true);
        try {
            let data: ImportedTransaction[] = [];

            if (file.name.endsWith(".ofx")) {
                const content = await file.text();
                data = await services.import.parseOFX(content);
            } else if (file.name.endsWith(".json")) {
                const content = await file.text();
                data = await services.import.parseJSON(content);
            } else if (file.name.endsWith(".pdf")) {
                const text = await extractTextFromPDF(file);
                data = await services.import.parsePDFText(text);
            } else {
                toast.error("Formato não suportado (.ofx, .json ou .pdf)");
                return;
            }

            if (data.length === 0) {
                toast.warning("Nenhuma transação foi encontrada no arquivo.");
            } else {
                setParsedData(data);
            }
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Erro desconhecido";
            toast.error("Erro ao processar arquivo: " + msg);
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (parsedData.length === 0 || !selectedWalletId) return;
        setImporting(true);
        try {
            // Busca categoria "Geral" - fallback para qualquer outra se não existir
            const allCategories = await services.categories.list();
            const geralCategory =
                allCategories.find((c) => c.name?.toLowerCase() === "geral") ??
                allCategories.find((c) => c.name?.toLowerCase() === "outros") ??
                allCategories[0] ?? null;
            const defaultCategoryId = geralCategory?.id ?? null;

            // Deduplicação: busca transações existentes no mesmo período
            const sortedDates = parsedData.map((t) => t.date).sort();
            const startDate = sortedDates[0];
            const endDate = sortedDates[sortedDates.length - 1];

            const existing = await services.transactions.getHistory({ startDate, endDate });

            const normalizeDesc = (s: string) =>
                s.toUpperCase().replace(/\s+/g, " ").trim().substring(0, 30);

            const existingKeys = new Set(
                existing.map((t) =>
                    `${t.date?.substring(0, 10)}|${normalizeDesc(t.description)}|${t.amount}`
                )
            );

            const toImport: ImportedTransaction[] = [];
            const skipped: ImportedTransaction[] = [];

            for (const tx of parsedData) {
                const key = `${tx.date}|${normalizeDesc(tx.description)}|${tx.amount}`;
                if (existingKeys.has(key)) {
                    skipped.push(tx);
                } else {
                    toImport.push(tx);
                }
            }

            if (toImport.length === 0) {
                toast.warning(`Todas as ${parsedData.length} transações já existem. Nenhuma importada.`);
                setImporting(false);
                return;
            }

            // Importa apenas as novas na carteira selecionada
            for (const tx of toImport) {
                await services.transactions.registerTransaction({
                    description: tx.description,
                    amount: tx.amount,
                    type: tx.type,
                    date: tx.date,
                    wallet_id: selectedWalletId,
                    ...(defaultCategoryId ? { category_id: defaultCategoryId } : {}),
                    status: "completed" as const,
                    payment_method: "pix",
                    is_recurring: false,
                    recurrence_interval: undefined,
                });
            }

            setImportResult({ imported: toImport.length, skipped: skipped.length });
            toast.success(
                `✅ ${toImport.length} importadas${skipped.length > 0 ? ` · 🛑 ${skipped.length} duplic. ignoradas` : ""}`
            );
            setParsedData([]);
            setFile(null);
        } catch (error: unknown) {
            console.error("[Import] Erro:", error);
            let msg = "Erro desconhecido";
            if (error instanceof Error) {
                msg = error.message;
            } else if (typeof error === "object" && error !== null) {
                const sbErr = error as Record<string, unknown>;
                msg = String(sbErr.message ?? sbErr.details ?? sbErr.code ?? JSON.stringify(error));
            }
            toast.error("Erro na importação: " + msg);
        } finally {
            setImporting(false);
        }
    };

    const resetAll = () => {
        setImportResult(null);
        setParsedData([]);
        setFile(null);
    };

    const selectedWallet = wallets.find((w) => w.id === selectedWalletId);
    const income = parsedData.filter((t) => t.type === "income");
    const expense = parsedData.filter((t) => t.type === "expense");
    const totalIncome = income.reduce((s, t) => s + t.amount, 0);
    const totalExpense = expense.reduce((s, t) => s + t.amount, 0);

    return (
        <Dialog open={isOpen} onOpenChange={(v) => { setIsOpen(v); if (!v) resetAll(); }}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="flex items-center gap-2 rounded-none bg-card border border-border hover:bg-secondary text-foreground font-black uppercase tracking-widest text-[10px] h-[42px] px-6 transition-all shadow-none"
                >
                    <FileUp className="w-4 h-4" strokeWidth={2} />
                    <span>Importar Extrato</span>
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl max-h-[88vh] overflow-hidden flex flex-col rounded-none border-2 border-border bg-card shadow-none p-0">
                <DialogHeader className="px-8 pt-8 pb-4 border-b border-border shrink-0">
                    <DialogTitle className="text-sm font-black uppercase tracking-widest text-foreground">
                        Importar Transações (OFX / JSON / PDF)
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-5 px-8 py-6 overflow-y-auto flex-1">
                    {importResult ? (
                        /* ── TELA: Resultado ── */
                        <div className="flex flex-col items-center justify-center gap-6 py-8 text-center">
                            <div className="w-16 h-16 rounded-none bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center">
                                <TrendingUp className="w-8 h-8 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-black uppercase tracking-widest text-foreground">
                                    Importação Concluída!
                                </p>
                                <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase tracking-wider">
                                    Carteira: <strong>{selectedWallet?.name}</strong>
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 w-full">
                                <div className="border-2 border-green-500/30 bg-green-500/5 p-4 text-center">
                                    <p className="text-2xl font-black text-green-600">{importResult.imported}</p>
                                    <p className="text-[8px] uppercase font-black text-muted-foreground tracking-widest mt-1">Importadas</p>
                                </div>
                                <div className="border-2 border-border p-4 text-center">
                                    <p className="text-2xl font-black text-muted-foreground">{importResult.skipped}</p>
                                    <p className="text-[8px] uppercase font-black text-muted-foreground tracking-widest mt-1">Duplicadas Ignoradas</p>
                                </div>
                            </div>
                            <Button
                                className="w-full h-[42px] bg-foreground text-background font-black uppercase tracking-widest text-[10px] rounded-none hover:bg-foreground/90"
                                onClick={() => { resetAll(); setIsOpen(false); }}
                            >
                                Fechar
                            </Button>
                        </div>
                    ) : !parsedData.length ? (
                        /* ── TELA: Upload + Carteira ── */
                        <div className="space-y-4">
                            {/* Wallet Selector */}
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Wallet className="w-3.5 h-3.5" /> Carteira de Destino
                                </p>
                                <div className="grid grid-cols-1 gap-2">
                                    {wallets.length === 0 ? (
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider border border-dashed border-border p-3 text-center">
                                            Nenhuma carteira encontrada. Crie uma carteira primeiro.
                                        </p>
                                    ) : (
                                        wallets.map((w) => (
                                            <button
                                                key={w.id}
                                                onClick={() => setSelectedWalletId(w.id)}
                                                className={cn(
                                                    "flex items-center justify-between px-4 py-3 border-2 text-left transition-colors",
                                                    selectedWalletId === w.id
                                                        ? "border-foreground bg-foreground/5"
                                                        : "border-border hover:border-foreground/40 hover:bg-secondary/30"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full",
                                                        selectedWalletId === w.id ? "bg-foreground" : "bg-border"
                                                    )} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground">{w.name}</span>
                                                </div>
                                                <span className="text-[10px] font-bold text-muted-foreground">
                                                    R$ {w.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                                </span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Drop Zone */}
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <FileUp className="w-3.5 h-3.5" /> Arquivo do Extrato
                                </p>
                                <label
                                    htmlFor="file-upload"
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-none p-8 text-center bg-secondary/10 cursor-pointer transition-colors hover:bg-secondary/30",
                                        file && "border-primary/40 bg-primary/5"
                                    )}
                                >
                                    <FileUp className={cn("w-10 h-10 transition-colors", file ? "text-primary" : "text-muted-foreground")} />
                                    {file ? (
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary">{file.name}</p>
                                            <p className="text-[9px] font-bold text-muted-foreground mt-1 uppercase tracking-wider">
                                                {(file.size / 1024).toFixed(1)} KB · Clique para trocar
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                Selecione ou arraste seu extrato
                                            </p>
                                            <p className="text-[9px] font-bold text-muted-foreground mt-1 uppercase tracking-wider">
                                                Suporta: .pdf · .ofx · .json
                                            </p>
                                        </div>
                                    )}
                                    <Input
                                        id="file-upload"
                                        type="file"
                                        accept=".ofx,.json,.pdf"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            </div>

                            <Button
                                className="w-full h-[42px] bg-foreground text-background font-black uppercase tracking-widest text-[10px] rounded-none hover:bg-foreground/90 border border-foreground flex items-center justify-center gap-2"
                                disabled={!file || !selectedWalletId || loading}
                                onClick={handlePreview}
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
                                {loading ? "Processando..." : "Visualizar Transações"}
                            </Button>
                        </div>
                    ) : (
                        /* ── TELA: Revisão ── */
                        <div className="space-y-4">
                            {/* Wallet info banner */}
                            <div className="flex items-center gap-3 px-4 py-3 border-2 border-foreground/20 bg-foreground/5">
                                <Wallet className="w-4 h-4 text-foreground shrink-0" />
                                <div>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Carteira selecionada</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground">{selectedWallet?.name}</p>
                                </div>
                                <button
                                    className="ml-auto text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={() => setParsedData([])}
                                >
                                    Trocar
                                </button>
                            </div>

                            {/* Summary Header */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="border-2 border-border p-3 text-center">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Total</p>
                                    <p className="text-sm font-black text-foreground">{parsedData.length}</p>
                                    <p className="text-[8px] uppercase font-bold text-muted-foreground">transações</p>
                                </div>
                                <div className="border-2 border-green-500/30 bg-green-500/5 p-3 text-center">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-green-600">Entradas</p>
                                    <p className="text-sm font-black text-green-600">
                                        +R$ {totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-[8px] uppercase font-bold text-muted-foreground">{income.length} itens</p>
                                </div>
                                <div className="border-2 border-destructive/30 bg-destructive/5 p-3 text-center">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-destructive">Saídas</p>
                                    <p className="text-sm font-black text-destructive">
                                        -R$ {totalExpense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-[8px] uppercase font-bold text-muted-foreground">{expense.length} itens</p>
                                </div>
                            </div>

                            {/* Transactions list */}
                            <div className="border border-border rounded-none divide-y divide-border overflow-hidden">
                                {parsedData.map((tx, i) => (
                                    <div key={i} className="px-4 py-3 flex justify-between items-center hover:bg-secondary/40 transition-colors">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={cn(
                                                "w-7 h-7 rounded-none flex items-center justify-center shrink-0",
                                                tx.type === "income" ? "bg-green-500/10" : "bg-destructive/10"
                                            )}>
                                                {tx.type === "income"
                                                    ? <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                                                    : <TrendingDown className="w-3.5 h-3.5 text-destructive" />
                                                }
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black uppercase tracking-wide text-foreground truncate">{tx.description}</p>
                                                <p className="text-[9px] font-bold text-muted-foreground uppercase">
                                                    {format(new Date(tx.date + "T12:00:00"), "dd 'de' MMM yyyy", { locale: ptBR })}
                                                </p>
                                            </div>
                                        </div>
                                        <p className={cn(
                                            "text-xs font-black tracking-widest shrink-0 ml-4",
                                            tx.type === "income" ? "text-green-600" : "text-destructive"
                                        )}>
                                            {tx.type === "income" ? "+" : "-"}
                                            R$ {tx.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Notice */}
                            <div className="p-4 bg-muted/30 rounded-none border border-border flex gap-3">
                                <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                                <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed tracking-wider">
                                    As transações serão salvas na carteira <strong>{selectedWallet?.name}</strong> com categoria <strong>Geral</strong>. Você poderá editar depois.
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="h-[42px] rounded-none border border-border font-black uppercase tracking-widest text-[10px] text-muted-foreground hover:text-foreground"
                                    onClick={() => setParsedData([])}
                                >
                                    Voltar
                                </Button>
                                <Button
                                    className="flex-1 h-[42px] bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] rounded-none hover:bg-primary/90 border border-primary shadow-none flex items-center justify-center gap-2"
                                    disabled={importing}
                                    onClick={handleImport}
                                >
                                    {importing && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {importing ? "Importando..." : `Confirmar ${parsedData.length} transações`}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// aria-label

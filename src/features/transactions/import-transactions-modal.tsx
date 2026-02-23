"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { services } from "@/core/application/services/services.factory";
import { ImportedTransaction } from "@/lib/validations";
import { toast } from "sonner";
import { FileUp, Check, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function ImportTransactionsModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ImportedTransaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handlePreview = async () => {
        if (!file) return;
        setLoading(true);
        try {
            const content = await file.text();
            let data: ImportedTransaction[] = [];

            if (file.name.endsWith('.ofx')) {
                data = await services.import.parseOFX(content);
            } else if (file.name.endsWith('.json')) {
                data = await services.import.parseJSON(content);
            } else {
                toast.error("Formato de arquivo não suportado (.ofx ou .json)");
                return;
            }

            setParsedData(data);
        } catch (error: any) {
            toast.error("Erro ao ler arquivo: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (parsedData.length === 0) return;
        setImporting(true);
        try {
            // Pegar uma carteira padrão para a importação (simplificação)
            const wallets = await services.wallets.getUserWallets();
            if (wallets.length === 0) {
                toast.error("Você precisa criar uma carteira antes de importar.");
                return;
            }
            const defaultWalletId = wallets[0].id;

            // Importar transações sequencialmente (para manter a ordem e logs)
            for (const tx of parsedData) {
                await services.transactions.registerTransaction({
                    description: tx.description,
                    amount: tx.amount,
                    type: tx.type,
                    date: tx.date,
                    wallet_id: defaultWalletId,
                    category_id: "ef1f3f7e-1234-4567-890a-abcdef123456", // To-do: Sistema de mapeamento inteligente
                    status: 'completed',
                    payment_method: 'credit_card'
                });
            }

            toast.success(`${parsedData.length} transações importadas com sucesso!`);
            setIsOpen(false);
            setParsedData([]);
            setFile(null);
        } catch (error: any) {
            toast.error("Erro na importação: " + error.message);
        } finally {
            setImporting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="flex items-center gap-2 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/30 text-blue-700 dark:text-blue-400 font-bold h-11 px-6 transition-all shadow-sm"
                >
                    <FileUp className="w-4 h-4" strokeWidth={2.5} />
                    <span className="text-[13px] tracking-tight">Importar Extrato</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Importar Transações (OFX/JSON)</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {!parsedData.length ? (
                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-slate-100 rounded-xl p-8 text-center bg-slate-50/50">
                                <FileUp className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm text-slate-500 mb-4">Selecione seu arquivo de extrato bancário</p>
                                <Input
                                    type="file"
                                    accept=".ofx,.json"
                                    className="max-w-xs mx-auto"
                                    onChange={handleFileChange}
                                />
                            </div>
                            <Button
                                className="w-full h-12 bg-slate-900"
                                disabled={!file || loading}
                                onClick={handlePreview}
                            >
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Visualizar Transações
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                <div className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-emerald-600" />
                                    <div>
                                        <p className="text-sm font-semibold text-emerald-900">Arquivo processado</p>
                                        <p className="text-xs text-emerald-700">{parsedData.length} transações encontradas</p>
                                    </div>
                                </div>
                                <Button variant="ghost" className="text-xs" onClick={() => setParsedData([])}>Trocar arquivo</Button>
                            </div>

                            <div className="border rounded-xl divide-y overflow-hidden">
                                {parsedData.map((tx, i) => (
                                    <div key={i} className="p-3 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                        <div className="max-w-[70%]">
                                            <p className="text-sm font-medium text-slate-900 truncate">{tx.description}</p>
                                            <p className="text-xs text-slate-400">{format(new Date(tx.date), "dd 'de' MMMM", { locale: ptBR })}</p>
                                        </div>
                                        <p className={cn(
                                            "text-sm font-semibold",
                                            tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                                        )}>
                                            {tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                                <p className="text-xs text-amber-800 leading-relaxed">
                                    As transações serão importadas para sua carteira principal. Você poderá editar a categoria de cada uma após a importação.
                                </p>
                            </div>

                            <Button
                                className="w-full h-12 bg-slate-900"
                                disabled={importing}
                                onClick={handleImport}
                            >
                                {importing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Confirmar Importação de {parsedData.length} itens
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}

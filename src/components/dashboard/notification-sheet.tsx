"use client";

import { createClient } from "@/lib/supabase/client";
import {
    Bell,
    AlertCircle,
    CheckCircle2,
    ArrowRight,
    Calendar,
    Zap,
    X,
    MoreHorizontal,
    Check
} from "lucide-react";
import { useEffect, useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Notification {
    id: string;
    type: 'payment' | 'alert' | 'success';
    title: string;
    description: string;
    date: string;
    amount?: number;
    isRead: boolean;
    subIcon?: any;
}

import { motion, AnimatePresence } from "framer-motion";
import { APPLE_SPRING, APPLE_SOFT_SPRING } from "@/lib/utils";

export function NotificationSheet() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
    const [isMobile, setIsMobile] = useState(false);
    const [showBanner, setShowBanner] = useState(false); // Default to false, check in useEffect
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
    const supabase = createClient();

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);

        // Persistence check
        const bannerDismissed = localStorage.getItem('notifications-banner-dismissed');
        const hasPermission = 'Notification' in window && Notification.permission === 'granted';

        if (!bannerDismissed && !hasPermission) {
            setShowBanner(true);
        }

        if ('Notification' in window) {
            setPermissionStatus(Notification.permission);
        }

        fetchNotifications();

        // Listen for transaction changes to update notifications in real-time
        const channel = supabase
            .channel('notification_updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'transactions' },
                () => fetchNotifications()
            )
            .subscribe();

        return () => {
            window.removeEventListener('resize', checkMobile);
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: pendingTx } = await supabase
            .from("transactions")
            .select("id, description, amount, date")
            .eq("user_id", user.id)
            .eq("status", "pending")
            .order("date", { ascending: true }) // Show soonest first
            .limit(20);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const txNotifications: Notification[] = (pendingTx || []).map(tx => {
            const txDate = new Date(tx.date);
            txDate.setHours(0, 0, 0, 0);

            const isOverdue = txDate < today;
            const diffTime = txDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let title = "Pagamento Pendente";
            if (isOverdue) title = "Pagamento Atrasado ⚠️";
            else if (diffDays === 0) title = "Vence Hoje! ⚡";
            else if (diffDays <= 3) title = `Vence em ${diffDays} dias`;

            return {
                id: tx.id,
                type: isOverdue ? 'payment' : 'payment', // Both use payment icon for now but title changes
                title,
                description: `Vencimento de ${tx.description}`,
                amount: tx.amount,
                date: tx.date,
                isRead: false,
                subIcon: Calendar,
                isOverdue
            };
        });

        const systemAlerts: Notification[] = [
            {
                id: 'ai-brain',
                type: 'alert',
                title: "IA Brain v2.0",
                description: "Seu dashboard está otimizado e monitorando anomalias.",
                date: new Date().toISOString(),
                isRead: false,
                subIcon: Zap
            }
        ];

        setNotifications([...txNotifications, ...systemAlerts]);
        setLoading(false);
    };

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        toast.success("Notificação marcada como lida");
    };

    const markAllAsRead = () => {
        const unreadCount = notifications.filter(n => !n.isRead).length;
        if (unreadCount === 0) {
            toast.info("Todas as notificações já estão lidas!");
            return;
        }

        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        toast.success(`${unreadCount} notificações marcadas como lidas`);
    };

    const enablePush = async () => {
        if (!('Notification' in window)) {
            toast.error("Este navegador não suporta notificações.");
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            setPermissionStatus(permission);

            if (permission === 'granted') {
                localStorage.setItem('notifications-banner-dismissed', 'true');
                setShowBanner(false);
                toast.success("Notificações Push ativadas com sucesso!");
            } else if (permission === 'denied') {
                localStorage.setItem('notifications-banner-dismissed', 'true');
                setShowBanner(false);
                toast.error("Notificações bloqueadas no navegador. Clique no ícone de 'Cadeado' na barra de endereços para permitir.");
            } else {
                toast.error("Permissão de notificação não concedida.");
            }
        } catch (error) {
            console.error("Erro ao solicitar permissão:", error);
        }
    };

    const ignoreBanner = () => {
        localStorage.setItem('notifications-banner-dismissed', 'true');
        setShowBanner(false);
    };

    const filteredNotifications = activeTab === 'all'
        ? notifications
        : notifications.filter(n => !n.isRead);

    const hasUnread = notifications.some(n => !n.isRead);

    return (
        <Sheet>
            <SheetTrigger asChild>
                <motion.button
                    whileTap={{ scale: 0.96 }}
                    className="p-2 md:p-2.5 rounded-2xl bg-white dark:bg-white/5 border border-slate-100/50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-all text-slate-400 hover:text-blue-500 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)] relative group"
                >
                    <Bell className="h-5 w-5 transition-transform group-hover:rotate-12" />
                    {hasUnread && (
                        <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-blue-500 rounded-full border-2 border-white dark:border-[#1C1C1E] animate-pulse"></span>
                    )}
                </motion.button>
            </SheetTrigger>
            <SheetContent
                side={isMobile ? "bottom" : "right"}
                className={cn(
                    "p-0 border-none bg-white dark:bg-[#1C1C1E]",
                    isMobile
                        ? "h-[90vh] rounded-t-[40px]"
                        : "h-[calc(100vh-32px)] w-[420px] m-4 rounded-[32px] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.12)]"
                )}
                showCloseButton={false}
            >
                <div className="h-full flex flex-col relative">
                    {isMobile && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-100/60 dark:bg-white/10 rounded-full z-10" />
                    )}

                    <SheetHeader className="p-10 pb-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <SheetTitle className="text-2xl font-bold text-foreground tracking-tight">Notificações</SheetTitle>
                            <div className="flex items-center gap-2">
                                <button className="p-2 text-muted-foreground hover:text-foreground active:scale-90 transition-all">
                                    <MoreHorizontal className="h-5 w-5" />
                                </button>
                                <SheetClose asChild>
                                    <button className="p-2 text-muted-foreground hover:text-foreground md:hidden">
                                        <X className="h-5 w-5" />
                                    </button>
                                </SheetClose>
                            </div>
                        </div>

                        {/* Tabs Style from Image */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={cn(
                                    "px-6 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all",
                                    activeTab === 'all'
                                        ? "bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg shadow-black/10"
                                        : "bg-slate-50 dark:bg-white/5 text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/10"
                                )}
                            >
                                Tudo
                            </button>
                            <button
                                onClick={() => setActiveTab('unread')}
                                className={cn(
                                    "px-6 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all",
                                    activeTab === 'unread'
                                        ? "bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg shadow-black/10"
                                        : "bg-slate-50 dark:bg-white/5 text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/10"
                                )}
                            >
                                Não lidas
                            </button>
                        </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto px-10 py-6 space-y-8 custom-scrollbar">
                        <AnimatePresence>
                            {showBanner && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={APPLE_SOFT_SPRING as any}
                                    className="p-8 bg-slate-50/50 border border-slate-100/50 rounded-[32px] relative overflow-hidden"
                                >
                                    <button
                                        onClick={ignoreBanner}
                                        className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-all"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                    <h4 className="font-bold text-foreground mb-2 pr-6 text-[15px] tracking-tight">Alertas em Tempo Real</h4>
                                    <p className="text-[13px] text-muted-foreground mb-6 leading-relaxed">
                                        Ative as notificações para receber atualizações instantâneas sobre seus gastos e metas.
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={enablePush}
                                            className="flex-1 py-3 bg-blue-500 text-white rounded-2xl text-[11px] font-semibold uppercase tracking-wider hover:bg-blue-600 transition-all active:scale-95"
                                        >
                                            Ativar
                                        </button>
                                        <button
                                            onClick={ignoreBanner}
                                            className="flex-1 py-3 bg-white border border-slate-100 text-slate-500 rounded-2xl text-[11px] font-semibold uppercase tracking-wider hover:bg-slate-50 transition-all active:scale-95"
                                        >
                                            Ignorar
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-6">
                            <div className="flex justify-between items-center px-1">
                                <h3 className="font-bold text-muted-foreground text-[11px] uppercase tracking-[0.2em]">Recentes</h3>
                                <button
                                    onClick={() => setActiveTab('all')}
                                    className="text-[11px] font-bold text-blue-500 hover:text-blue-600 transition-colors uppercase tracking-wider"
                                >
                                    Limpar tudo
                                </button>
                            </div>

                            <div className="space-y-2 pb-10">
                                {loading ? (
                                    Array(3).fill(0).map((_, i) => (
                                        <div key={i} className="flex gap-4 p-4 items-center">
                                            <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-4 w-3/4" />
                                                <Skeleton className="h-3 w-1/2" />
                                            </div>
                                        </div>
                                    ))
                                ) : filteredNotifications.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center py-20"
                                    >
                                        <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Check className="h-8 w-8 text-slate-200 dark:text-muted-foreground/30" />
                                        </div>
                                        <p className="text-muted-foreground text-sm font-bold">Você está em dia</p>
                                    </motion.div>
                                ) : (
                                    <AnimatePresence mode="popLayout">
                                        {filteredNotifications.map((n, index) => (
                                            <motion.div
                                                layout
                                                key={n.id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ ...APPLE_SOFT_SPRING, delay: index * 0.05 } as any}
                                                onClick={() => markAsRead(n.id)}
                                                className={cn(
                                                    "flex gap-5 p-5 rounded-[24px] hover:bg-slate-50/80 dark:hover:bg-white/5 transition-all group relative cursor-pointer active:scale-[0.98]",
                                                    !n.isRead ? "bg-white dark:bg-blue-500/[0.03] border border-transparent dark:border-blue-500/10" : "opacity-40 grayscale"
                                                )}
                                            >
                                                <div className="relative shrink-0">
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-[18px] flex items-center justify-center overflow-hidden border transition-all",
                                                        (n as any).isOverdue
                                                            ? "bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-500"
                                                            : "bg-slate-50 dark:bg-white/5 border-slate-100/50 dark:border-white/5 text-slate-400 dark:text-muted-foreground"
                                                    )}>
                                                        {n.type === 'payment' ? (
                                                            <Calendar className={cn("h-5 w-5", (n as any).isOverdue ? "text-rose-500" : "text-orange-400")} />
                                                        ) : n.type === 'alert' ? (
                                                            <Zap className="h-5 w-5 text-blue-500" />
                                                        ) : (
                                                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[14px] font-bold text-foreground leading-snug mb-1">
                                                        <span className="font-extrabold">{n.title}</span> {n.description}
                                                    </p>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">
                                                            {formatDistanceToNow(new Date(n.date), { addSuffix: false, locale: ptBR })}
                                                        </span>
                                                        {n.amount && (
                                                            <span className="text-[12px] font-bold text-foreground/80">
                                                                R$ {n.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {!n.isRead && (
                                                    <div className="flex items-center pr-1">
                                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Final Action Button */}
                    <div className="p-10 pt-6 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border-t border-slate-50/50 dark:border-white/5">
                        <SheetClose asChild>
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={markAllAsRead}
                                className="w-full py-4.5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-[20px] font-bold text-[13px] uppercase tracking-[0.15em] shadow-[0_12px_32px_-8px_rgba(0,0,0,0.2)] hover:bg-slate-800 dark:hover:bg-slate-100 transition-all"
                            >
                                Marcar tudo como lido
                            </motion.button>
                        </SheetClose>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}


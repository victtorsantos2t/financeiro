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

        // Calcular data limite (hoje + 5 dias)
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() + 5);
        limitDate.setHours(23, 59, 59, 999);

        const { data: pendingTx } = await supabase
            .from("transactions")
            .select("id, description, amount, date")
            .eq("user_id", user.id)
            .eq("status", "pending")
            .lte("date", limitDate.toISOString()) // Apenas contas atrasadas ou vencendo em até 5 dias
            .order("date", { ascending: true }) // Show soonest first
            .limit(30);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const stored = localStorage.getItem('read-tx-notifications');
        const readIds: string[] = stored ? JSON.parse(stored) : [];

        const txNotifications: Notification[] = (pendingTx || []).map(tx => {
            // Fix timezone shift by explicitly parsing YYYY-MM-DD
            const [year, month, day] = tx.date.split("T")[0].split("-").map(Number);
            const txDate = new Date(year, month - 1, day);
            txDate.setHours(0, 0, 0, 0);

            const diffTime = txDate.getTime() - today.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            const isOverdue = diffDays < 0;
            const isToday = diffDays === 0;

            let title = "Pagamento Pendente";
            if (isOverdue) title = "Atrasado! ⚠️";
            else if (isToday) title = "Vence Hoje! ⚡";
            else if (diffDays === 1) title = "Vence amanhã";
            else title = `Vence em ${diffDays} dias`;

            return {
                id: tx.id,
                type: 'payment',
                title,
                description: `Vencimento de ${tx.description}`,
                amount: tx.amount,
                date: tx.date,
                isRead: readIds.includes(tx.id),
                subIcon: Calendar,
                isOverdue,
                isToday
            } as any;
        });

        const systemAlerts: Notification[] = [
            {
                id: 'ai-brain',
                type: 'alert',
                title: "IA Brain v2.0",
                description: "Seu dashboard está otimizado e monitorando anomalias.",
                date: new Date().toISOString(),
                isRead: readIds.includes('ai-brain'),
                subIcon: Zap
            } as any
        ];

        setNotifications([...txNotifications, ...systemAlerts].sort((a, b) => (a.isRead === b.isRead ? 0 : a.isRead ? 1 : -1)));
        setLoading(false);
    };

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        const stored = localStorage.getItem('read-tx-notifications');
        const readIds: string[] = stored ? JSON.parse(stored) : [];
        if (!readIds.includes(id)) {
            localStorage.setItem('read-tx-notifications', JSON.stringify([...readIds, id]));
        }
        toast.success("Notificação marcada como lida");
    };

    const markAllAsRead = () => {
        const unreadNotifications = notifications.filter(n => !n.isRead);
        if (unreadNotifications.length === 0) {
            toast.info("Todas as notificações já estão lidas!");
            return;
        }

        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

        const stored = localStorage.getItem('read-tx-notifications');
        const readIds: string[] = stored ? JSON.parse(stored) : [];
        const newIds = unreadNotifications.map(n => n.id);

        localStorage.setItem('read-tx-notifications', JSON.stringify(Array.from(new Set([...readIds, ...newIds]))));

        toast.success(`${unreadNotifications.length} notificações marcadas como lidas`);
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
                    className="p-2 md:p-2.5 rounded-none bg-background border border-transparent hover:border-border transition-all text-muted-foreground hover:text-foreground shadow-none relative group h-[42px] w-[42px] flex items-center justify-center"
                >
                    <Bell className="h-5 w-5 transition-transform group-hover:rotate-12 stroke-[2.5]" />
                    {hasUnread && (
                        <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-blue-500 rounded-none border border-background animate-pulse"></span>
                    )}
                </motion.button>
            </SheetTrigger>
            <SheetContent
                side={isMobile ? "bottom" : "right"}
                className={cn(
                    "p-0 border-2 border-border bg-card shadow-none",
                    isMobile
                        ? "h-[90vh] rounded-none border-b-0"
                        : "h-[calc(100vh-32px)] w-[420px] m-4 rounded-none"
                )}
                showCloseButton={false}
            >
                <div className="h-full flex flex-col relative">
                    {isMobile && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-muted rounded-none z-10" />
                    )}

                    <SheetHeader className="p-8 pb-2 border-b border-border bg-secondary/50 space-y-6">
                        <div className="flex items-center justify-between">
                            <SheetTitle className="text-sm font-black text-foreground uppercase tracking-widest">Notificações</SheetTitle>
                            <div className="flex items-center gap-2">
                                <button className="p-2 text-muted-foreground hover:text-foreground active:scale-90 transition-all">
                                    <MoreHorizontal className="h-5 w-5 stroke-[2.5]" />
                                </button>
                                <SheetClose asChild>
                                    <button className="p-2 text-muted-foreground hover:text-foreground md:hidden border border-transparent hover:border-border transition-all">
                                        <X className="h-5 w-5 stroke-[2.5]" />
                                    </button>
                                </SheetClose>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={cn(
                                    "px-6 py-2 rounded-none text-[10px] font-black uppercase tracking-widest border-2 transition-all",
                                    activeTab === 'all'
                                        ? "bg-primary border-primary text-primary-foreground shadow-none"
                                        : "bg-transparent border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                                )}
                            >
                                Tudo
                            </button>
                            <button
                                onClick={() => setActiveTab('unread')}
                                className={cn(
                                    "px-6 py-2 rounded-none text-[10px] font-black uppercase tracking-widest border-2 transition-all",
                                    activeTab === 'unread'
                                        ? "bg-primary border-primary text-primary-foreground shadow-none"
                                        : "bg-transparent border-transparent text-muted-foreground hover:border-border hover:text-foreground"
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
                                    className="p-6 bg-card border-2 border-border rounded-none relative overflow-hidden"
                                >
                                    <button
                                        onClick={ignoreBanner}
                                        className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-all"
                                    >
                                        <X className="h-4 w-4 stroke-[3]" />
                                    </button>
                                    <h4 className="font-black text-foreground mb-2 pr-6 text-[10px] uppercase tracking-widest">Alertas em Tempo Real</h4>
                                    <p className="text-[8px] uppercase tracking-widest font-bold text-muted-foreground mb-6 leading-relaxed">
                                        Ative as notificações para receber atualizações instantâneas sobre seus gastos e metas.
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={enablePush}
                                            className="flex-1 py-3 bg-primary border border-primary text-primary-foreground rounded-none text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-95"
                                        >
                                            Ativar
                                        </button>
                                        <button
                                            onClick={ignoreBanner}
                                            className="flex-1 py-3 bg-transparent border border-border text-foreground rounded-none text-[10px] font-black uppercase tracking-widest hover:bg-secondary transition-all active:scale-95"
                                        >
                                            Ignorar
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-6">
                            <div className="flex justify-between items-center px-1">
                                <h3 className="font-black text-foreground text-[10px] uppercase tracking-widest">Recentes</h3>
                                <button
                                    onClick={markAllAsRead}
                                    className="text-[8px] font-black text-muted-foreground hover:text-foreground border border-transparent hover:border-border transition-all uppercase tracking-widest px-2 py-1"
                                >
                                    Limpar tudo
                                </button>
                            </div>

                            <div className="space-y-2 pb-10">
                                {loading ? (
                                    Array(3).fill(0).map((_, i) => (
                                        <div key={i} className="flex gap-4 p-4 border-b border-border items-center">
                                            <Skeleton className="h-[42px] w-[42px] rounded-none bg-muted shrink-0" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-4 w-3/4 rounded-none bg-muted" />
                                                <Skeleton className="h-3 w-1/2 rounded-none bg-muted" />
                                            </div>
                                        </div>
                                    ))
                                ) : filteredNotifications.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center py-20"
                                    >
                                        <div className="w-16 h-16 bg-background border-2 border-border rounded-none flex items-center justify-center mx-auto mb-4">
                                            <Check className="h-8 w-8 text-muted-foreground stroke-[3]" />
                                        </div>
                                        <p className="text-foreground text-[10px] font-black uppercase tracking-widest">Você está em dia</p>
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
                                                    "flex gap-5 px-1 py-5 border-b border-border transition-all group relative cursor-pointer active:scale-[0.98]",
                                                    !n.isRead ? "bg-transparent text-foreground" : "opacity-40 grayscale"
                                                )}
                                            >
                                                <div className="relative shrink-0">
                                                    <div className={cn(
                                                        "w-[42px] h-[42px] rounded-none flex items-center justify-center overflow-hidden border-2 transition-all",
                                                        (n as any).isOverdue
                                                            ? "bg-destructive/10 border-destructive/30 text-destructive"
                                                            : (n as any).isToday
                                                                ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-500"
                                                                : "bg-background border-border text-foreground group-hover:border-primary/50"
                                                    )}>
                                                        {n.type === 'payment' ? (
                                                            <Calendar className={cn("h-5 w-5 stroke-[2.5]", (n as any).isOverdue ? "text-destructive" : (n as any).isToday ? "text-yellow-600 dark:text-yellow-500" : "text-foreground")} />
                                                        ) : n.type === 'alert' ? (
                                                            <Zap className={cn("h-5 w-5 stroke-[2.5]", (n as any).isOverdue ? "text-destructive" : "text-amber-500")} />
                                                        ) : (
                                                            <CheckCircle2 className="h-5 w-5 text-emerald-500 stroke-[2.5]" />
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground leading-snug mb-2">
                                                        <span className={cn(
                                                            "transition-colors",
                                                            (n as any).isOverdue ? "text-destructive" : (n as any).isToday ? "text-yellow-600 dark:text-yellow-500" : "text-primary group-hover:text-primary/80"
                                                        )}>{n.title}</span> - {n.description}
                                                    </p>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                                                            {formatDistanceToNow(new Date(n.date), { addSuffix: false, locale: ptBR })}
                                                        </span>
                                                        {n.amount && (
                                                            <span className="text-[10px] font-black text-foreground uppercase tracking-widest">
                                                                R$ {n.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {!n.isRead && (
                                                    <div className="flex items-center pr-1">
                                                        <div className="w-2 h-2 bg-primary rounded-none border border-current" />
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
                    <div className="p-6 bg-card border-t border-border mt-auto">
                        <SheetClose asChild>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={markAllAsRead}
                                className="w-full flex items-center justify-center py-0 h-[42px] bg-primary text-primary-foreground rounded-none font-black text-[10px] uppercase tracking-widest shadow-none border border-primary hover:bg-primary/90 transition-all"
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


// aria-label

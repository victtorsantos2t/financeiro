"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                },
            },
        });

        if (error) {
            toast.error("Erro ao cadastrar", {
                description: error.message
            });
            setLoading(false);
        } else {
            toast.success("Conta criada com sucesso!", {
                description: "Agora você pode fazer login."
            });
            router.push("/login");
        }
    };

    return (
        <div className="relative h-screen flex flex-col bg-white font-sans overflow-hidden">
            {/* 1. MAIN CONTENT */}
            <main className="flex-1 flex items-center justify-center p-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-[460px]"
                >
                    <div className="bg-white rounded-[32px] p-8 sm:py-10 sm:px-12 space-y-6">
                        {/* Custom Brand Logo */}
                        <div className="flex justify-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                                <Image
                                    src="/brand-logo.png"
                                    alt="Financeiro Logo"
                                    width={56}
                                    height={56}
                                    className="object-contain"
                                    priority
                                />
                            </div>
                        </div>

                        {/* Title */}
                        <div className="text-center space-y-1">
                            <h1 className="text-[24px] sm:text-[28px] font-bold text-slate-900 tracking-tight leading-tight">
                                Criar conta
                            </h1>
                            <p className="text-slate-500 font-medium">
                                Comece sua jornada financeira premium
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="space-y-[1px] bg-slate-200 rounded-2xl overflow-hidden border border-slate-200">
                                <div className="bg-white group">
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Nome Completo"
                                        className="w-full h-14 px-6 text-base font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:ring-inset transition-all"
                                    />
                                </div>
                                <div className="bg-white group">
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="E-mail"
                                        className="w-full h-14 px-6 text-base font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:ring-inset transition-all"
                                    />
                                </div>
                                <div className="bg-white group">
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Senha"
                                        className="w-full h-14 px-6 text-base font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:ring-inset transition-all"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-14 bg-[#0071e3] hover:bg-[#007aff] text-white rounded-2xl font-bold text-base transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Criar conta"}
                            </Button>
                        </form>

                        <div className="text-center">
                            <p className="text-sm text-slate-500 font-medium">
                                Já tem uma conta?{" "}
                                <Link href="/login" className="text-[#0071e3] hover:underline transition-all">
                                    Fazer login
                                </Link>
                            </p>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-400 text-center font-medium max-w-[340px] mx-auto opacity-70 pt-4">
                            As informações da sua conta são utilizadas para permitir o acesso seguro aos seus dados.
                        </p>
                    </div>
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="w-full px-6 py-4 text-center border-t border-slate-50">
                <p className="text-[11px] font-semibold text-slate-300 uppercase tracking-widest">
                    Financeiro Premium © 2026
                </p>
            </footer>
        </div>
    );
}

// aria-label

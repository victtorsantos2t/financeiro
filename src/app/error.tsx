'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
            <div className="bg-destructive/10 p-4 rounded-full mb-6 text-destructive">
                <AlertTriangle className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Ops! Algo deu errado</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
                Ocorreu um erro inesperado. Já fomos notificados e estamos trabalhando para resolver.
            </p>
            <div className="flex gap-4">
                <Button onClick={() => reset()} variant="default" className="rounded-xl px-8">
                    Tentar novamente
                </Button>
                <Button onClick={() => window.location.href = '/dashboard'} variant="outline" className="rounded-xl px-8">
                    Voltar ao Início
                </Button>
            </div>
        </div>
    );
}

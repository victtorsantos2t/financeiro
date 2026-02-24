"use client";

/**
 * IOSPageHeader — Header Large Title reutilizável para páginas mobile
 *
 * Uso:
 *   <IOSPageHeader title="Minha Página" subtitle="Descrição opcional" />
 */

import { ChevronLeft } from "lucide-react";

const iOSFont = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui";

interface IOSPageHeaderProps {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    showBack?: boolean;
    onBack?: () => void;
}

export function IOSPageHeader({ title, subtitle, action, showBack, onBack }: IOSPageHeaderProps) {
    return (
        <div
            className="md:hidden sticky top-0 z-40 px-4 pb-3 -mx-4 -mt-5 transition-colors duration-300"
            style={{
                background: 'var(--ios-header-blur, rgba(242,242,247,0.94))',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                borderBottom: '0.5px solid var(--ios-separator, rgba(0,0,0,0.12))',
                paddingTop: 'max(env(safe-area-inset-top), 22px)',
                fontFamily: iOSFont,
            }}
        >
            <div className="flex flex-col gap-2">
                {showBack && (
                    <button
                        onClick={onBack}
                        className="flex items-center gap-1 -ml-1 h-8 text-primary active:opacity-60 transition-opacity"
                    >
                        <ChevronLeft className="h-6 w-6" />
                        <span className="text-base font-normal">Voltar</span>
                    </button>
                )}

                <div className="flex items-end justify-between">
                    <div>
                        <h1 style={{
                            fontSize: 24,
                            fontWeight: 700,
                            letterSpacing: '-0.5px',
                            color: 'var(--ios-label, #000)',
                            lineHeight: 1.1,
                        }}>
                            {title}
                        </h1>
                        {subtitle && (
                            <p style={{
                                fontSize: 12,
                                fontWeight: 400,
                                color: 'var(--ios-label3, #8E8E93)',
                                marginTop: 1,
                                letterSpacing: '-0.1px',
                            }}>
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {action && (
                        <div style={{ paddingBottom: 2 }}>
                            {action}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// aria-label

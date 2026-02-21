"use client";

/**
 * IOSPageHeader — Header Large Title reutilizável para páginas mobile
 *
 * Uso:
 *   <IOSPageHeader title="Minha Página" subtitle="Descrição opcional" />
 */

const iOSFont = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui";

interface IOSPageHeaderProps {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
}

export function IOSPageHeader({ title, subtitle, action }: IOSPageHeaderProps) {
    return (
        <div
            className="md:hidden sticky top-0 z-40 px-4 pb-4 -mx-4 -mt-5 transition-colors duration-300"
            style={{
                background: 'var(--ios-header-blur, rgba(242,242,247,0.94))',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                borderBottom: '0.5px solid var(--ios-separator, rgba(0,0,0,0.12))',
                paddingTop: 'max(env(safe-area-inset-top), 56px)',
                fontFamily: iOSFont,
            }}
        >
            <div className="flex items-end justify-between">
                <div>
                    <h1 style={{
                        fontSize: 34,
                        fontWeight: 700,
                        letterSpacing: '-0.5px',
                        color: 'var(--ios-label, #000)',
                        lineHeight: 1.1,
                    }}>
                        {title}
                    </h1>
                    {subtitle && (
                        <p style={{
                            fontSize: 13,
                            fontWeight: 400,
                            color: 'var(--ios-label3, #8E8E93)',
                            marginTop: 2,
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
    );
}

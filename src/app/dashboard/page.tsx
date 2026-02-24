"use client";

import dynamic from 'next/dynamic';

const DraggableDashboard = dynamic(() => import('@/features/dashboard/draggable-dashboard'), {
    ssr: false,
    loading: () => <div className="p-8 text-center text-slate-400">Carregando Dashboard...</div>
});

export default function DashboardPage() {
    return <DraggableDashboard />;
}

// aria-label

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WidgetLayoutState {
    layout: string[]; // Array of widget IDs
    setLayout: (layout: string[]) => void;
    resetLayout: () => void;
}

const DEFAULT_LAYOUT = [
    'wallet-summary',
    'financial-health',
    'payable-accounts',
    'cash-flow-forecast',
    'monthly-chart',
    'earnings-donut',
    'credit-card',
    'transactions-table',
    'quick-actions'
];

export const useWidgetStore = create<WidgetLayoutState>()(
    persist(
        (set) => ({
            layout: DEFAULT_LAYOUT,
            setLayout: (layout) => set({ layout }),
            resetLayout: () => set({ layout: DEFAULT_LAYOUT }),
        }),
        {
            name: 'widget-layout', // chave padronizada
            onRehydrateStorage: () => (state) => {
                // Se o layout estiver vazio ou inválido, força DEFAULT_LAYOUT
                if (state && (!state.layout || state.layout.length === 0)) {
                    state.layout = DEFAULT_LAYOUT;
                }
            }
        }
    )
);

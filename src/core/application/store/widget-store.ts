import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WidgetLayoutState {
    layout: string[]; // Array of widget IDs
    setLayout: (layout: string[]) => void;
    resetLayout: () => void;
}

const DEFAULT_LAYOUT = [
    'smart-insights',
    'wallet-summary',
    'payable-accounts',
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
                if (state) {
                    // Se o layout estiver vazio ou inválido, força DEFAULT_LAYOUT
                    if (!state.layout || state.layout.length === 0) {
                        state.layout = DEFAULT_LAYOUT;
                    }
                    // Se o 'smart-insights' estiver faltando no layout existente (usuário antigo), adiciona no topo
                    else if (!state.layout.includes('smart-insights')) {
                        state.layout = ['smart-insights', ...state.layout];
                    }
                }
            }
        }
    )
);

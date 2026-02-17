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
    'monthly-chart',
    'earnings-donut',
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
            name: 'finance-flow-widget-layout', // unique name
        }
    )
);

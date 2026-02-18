"use client";

import React, { createContext, useContext, useState } from "react";

interface DashboardContextType {
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
    refreshTrigger: number;
    refreshData: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const refreshData = () => setRefreshTrigger(prev => prev + 1);

    return (
        <DashboardContext.Provider value={{ currentDate, setCurrentDate, refreshTrigger, refreshData }}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (context === undefined) {
        throw new Error("useDashboard must be used within a DashboardProvider");
    }
    return context;
}

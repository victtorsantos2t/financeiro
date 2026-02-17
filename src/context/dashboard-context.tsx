"use client";

import React, { createContext, useContext, useState } from "react";

interface DashboardContextType {
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
    const [currentDate, setCurrentDate] = useState(new Date());

    return (
        <DashboardContext.Provider value={{ currentDate, setCurrentDate }}>
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

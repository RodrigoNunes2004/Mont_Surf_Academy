"use client";

import { createContext, useContext, type ReactNode } from "react";

const DashboardContext = createContext<{ closeSidebar: () => void } | null>(null);

export function useDashboardContext() {
  return useContext(DashboardContext);
}

export function DashboardProvider({
  children,
  closeSidebar,
}: {
  children: ReactNode;
  closeSidebar: () => void;
}) {
  return (
    <DashboardContext.Provider value={{ closeSidebar }}>
      {children}
    </DashboardContext.Provider>
  );
}

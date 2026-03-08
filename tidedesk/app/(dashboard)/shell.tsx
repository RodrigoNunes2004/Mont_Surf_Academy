"use client";

import type { ReactNode } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { DashboardProvider } from "@/lib/dashboard-context";
import { useState } from "react";

export function DashboardShell({
  children,
  sidebar,
}: {
  children: ReactNode;
  sidebar: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <DashboardProvider closeSidebar={() => setOpen(false)}>
      <div className="flex min-h-screen min-w-0 bg-background">
        <div className="hidden md:fixed md:inset-y-0 md:flex">{sidebar}</div>

        <div className="min-w-0 flex-1 md:pl-64">
          <DashboardTopbar onOpenNav={() => setOpen(true)} />
          <main className="min-w-0 overflow-x-hidden p-3 sm:p-4 md:p-6">{children}</main>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="left"
            className="w-[85vw] max-w-[280px] p-0 sm:max-w-[300px]"
          >
            {sidebar}
          </SheetContent>
        </Sheet>
      </div>
    </DashboardProvider>
  );
}


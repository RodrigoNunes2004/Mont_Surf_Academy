"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useDashboardContext } from "@/lib/dashboard-context";
import {
  CalendarDays,
  LayoutDashboard,
  Receipt,
  Settings,
  ShoppingBag,
  Users,
  UserCircle,
  Waves,
} from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/rentals", label: "Rentals", icon: ShoppingBag },
  { href: "/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/equipment", label: "Equipment", icon: Waves },
  { href: "/instructors", label: "Instructors", icon: UserCircle },
  { href: "/revenue", label: "Revenue", icon: Receipt },
] as const;

export function DashboardSidebar() {
  const pathname = usePathname();
  const ctx = useDashboardContext();

  return (
    <aside className="flex h-full w-full min-w-0 flex-col border-r bg-sidebar text-sidebar-foreground md:w-64">
      <div className="flex items-center justify-between gap-2 px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/TD_logo.png"
            alt="TideDesk"
            width={48}
            height={48}
            className="shrink-0"
            style={{ width: "auto", height: "auto" }}
          />
          <span className="font-semibold tracking-tight">TideDesk</span>
        </Link>
        <Badge variant="secondary" className="text-xs">
          Internal
        </Badge>
      </div>
      <Separator />
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => ctx?.closeSidebar()}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-md px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <Separator />
      <div className="p-2">
        <Link
          href="/settings"
          onClick={() => ctx?.closeSidebar()}
          className={cn(
            "flex min-h-11 items-center gap-2 rounded-md px-3 py-2.5 text-sm transition-colors",
            pathname?.startsWith("/settings")
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
          )}
        >
          <Settings className="size-4 shrink-0" />
          Settings
        </Link>
      </div>
    </aside>
  );
}


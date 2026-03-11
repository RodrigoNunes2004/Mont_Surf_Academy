"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ExportType = "customers" | "bookings" | "revenue";

type Props = {
  type: ExportType;
};

function exportUrl(type: ExportType, status?: string): string {
  const params = new URLSearchParams();
  params.set("type", type);
  if (type === "customers" && status) {
    params.set("status", status);
  }
  return "/api/export?" + params.toString();
}

export function ExportButton({ type }: Props) {
  const href = exportUrl(type);

  if (type === "customers") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="mr-2 size-4" />
            Export CSV
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <a href={exportUrl("customers", "active")} download>
              Active customers
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={exportUrl("customers", "archived")} download>
              Archived customers
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={exportUrl("customers", "all")} download>
              All customers
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button variant="outline" size="sm" asChild>
      <a href={href} download>
        <Download className="mr-2 size-4" />
        Export CSV
      </a>
    </Button>
  );
}

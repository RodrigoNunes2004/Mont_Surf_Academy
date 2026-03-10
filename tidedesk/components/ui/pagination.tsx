"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  totalItems: number;
  pageSize: number;
  currentPage: number;
  paramKey: string;
};

export function Pagination({
  totalItems,
  pageSize,
  currentPage,
  paramKey,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  function buildUrl(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete(paramKey);
    } else {
      params.set(paramKey, String(page));
    }
    const q = params.toString();
    return q ? `${pathname}?${q}` : pathname;
  }

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-2 py-3">
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
        {totalItems > 0 && (
          <span className="ml-2">
            ({(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems})
          </span>
        )}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" asChild disabled={!hasPrev}>
          <Link href={hasPrev ? buildUrl(currentPage - 1) : "#"}>
            <ChevronLeft className="size-4" />
            Previous
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild disabled={!hasNext}>
          <Link href={hasNext ? buildUrl(currentPage + 1) : "#"}>
            Next
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { ConfirmationContent } from "@/components/book";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ bookingId?: string; session_id?: string }>;
};

export default async function ConfirmationPage({ params, searchParams }: Props) {
  const { businessSlug } = await params;
  const sp = await searchParams;

  if (!businessSlug?.trim()) notFound();

  const business = await prisma.business.findUnique({
    where: { slug: businessSlug.trim() },
    select: { id: true, name: true, slug: true },
  });

  if (!business) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="border-b border-slate-200/80 dark:border-slate-800">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/TD_logo.png"
              alt="TideDesk"
              width={100}
              height={32}
              className="h-8 w-auto object-contain"
            />
          </Link>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {business.name}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Booking confirmation
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Your lesson is confirmed
          </p>
        </div>

        <Suspense
          fallback={
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Loading…
              </CardContent>
            </Card>
          }
        >
          <ConfirmationContent
            businessSlug={business.slug!}
            bookingId={sp.bookingId}
            sessionId={sp.session_id}
          />
        </Suspense>

        <div className="mt-8 flex justify-center">
          <Link href={`/book/${businessSlug}`}>
            <Button variant="outline">Book another lesson</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

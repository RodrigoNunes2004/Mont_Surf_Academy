import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PublicBookingForm } from "@/components/book";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ embed?: string }>;
};

export default async function PublicBookingPage({ params, searchParams }: Props) {
  const { businessSlug } = await params;
  const { embed } = await searchParams;
  const isEmbed = embed === "1";

  if (!businessSlug?.trim()) notFound();

  const business = await prisma.business.findUnique({
    where: { slug: businessSlug.trim() },
    select: {
      id: true,
      name: true,
      slug: true,
      location: true,
    },
  });

  if (!business) notFound();

  return (
    <div
      className={`min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 ${isEmbed ? "py-2" : ""}`}
    >
      <header
        className={`border-b border-slate-200/80 dark:border-slate-800 ${isEmbed ? "px-2 py-2" : ""}`}
      >
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            {!isEmbed && (
              <>
                <Link href="/" className="flex items-center gap-2">
                  <Image
                    src="/TD_logo.png"
                    alt="TideDesk"
                    width={100}
                    height={32}
                    className="h-8 w-auto object-contain"
                  />
                </Link>
                <span className="text-slate-400 dark:text-slate-500">/</span>
              </>
            )}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {business.name}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Book a lesson
          </h1>
          {business.location && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {business.location}
            </p>
          )}
        </div>

        <PublicBookingForm businessSlug={business.slug!} />
      </main>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { QuoteForm } from "@/components/QuoteForm";
import { SetupBanner } from "@/components/SetupBanner";
import { createServerClient } from "@/lib/supabase/server";
import type { QuoteRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditQuotePage({ params }: { params: { id: string } }) {
  const supabase = createServerClient();
  if (!supabase) {
    return (
      <div className="space-y-6">
        <SetupBanner />
      </div>
    );
  }

  const { data, error } = await supabase.from("quotes").select("*").eq("id", params.id).maybeSingle();

  if (error) {
    return <p className="text-red-400">{error.message}</p>;
  }
  if (!data) {
    notFound();
  }

  const quote = data as QuoteRow;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <Link href={`/quotes/${params.id}`} className="text-sm text-sky-400 hover:underline">
          ← Back to quote
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Edit quote</h1>
        <p className="text-sm text-zinc-500">{quote.company_name}</p>
      </div>
      <QuoteForm mode="edit" quote={quote} />
    </div>
  );
}

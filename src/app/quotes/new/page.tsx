import { QuoteForm } from "@/components/QuoteForm";
import { SetupBanner } from "@/components/SetupBanner";
import { createServerClient } from "@/lib/supabase/server";

export default function NewQuotePage() {
  const supabase = createServerClient();
  if (!supabase) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-zinc-100">New quote</h1>
        <SetupBanner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">New quote</h1>
        <p className="mt-1 text-sm text-zinc-500">Create a quote and auto-generate follow-up dates.</p>
      </div>
      <QuoteForm mode="create" />
    </div>
  );
}

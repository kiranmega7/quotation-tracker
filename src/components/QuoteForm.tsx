"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createQuote, updateQuote, type QuoteFormState } from "@/app/actions/quotes";
import { PAYMENT_TERMS, QUOTE_STATUSES } from "@/lib/constants";
import type { PaymentTerms, QuoteRow, QuoteStatus } from "@/lib/types";

function emptyForm(): QuoteFormState {
  return {
    company_name: "",
    contact_name: "",
    contact_number: "",
    rfq_date: "",
    quote_sent_date: "",
    quote_value_sgd: "",
    profit_sgd: "",
    brand_description: "",
    payment_terms: "30 days",
    status: "Quoted",
  };
}

function fromQuote(q: QuoteRow): QuoteFormState {
  return {
    company_name: q.company_name,
    contact_name: q.contact_name ?? "",
    contact_number: q.contact_number ?? "",
    rfq_date: q.rfq_date ?? "",
    quote_sent_date: q.quote_sent_date ?? "",
    quote_value_sgd: String(q.quote_value_sgd ?? ""),
    profit_sgd: String(q.profit_sgd ?? ""),
    brand_description: q.brand_description ?? "",
    payment_terms: q.payment_terms as PaymentTerms,
    status: q.status as QuoteStatus,
  };
}

export function QuoteForm({
  quote,
  mode,
}: {
  quote?: QuoteRow;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [form, setForm] = useState<QuoteFormState>(
    quote ? fromQuote(quote) : emptyForm()
  );
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function update<K extends keyof QuoteFormState>(key: K, value: QuoteFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    startTransition(async () => {
      const res =
        mode === "create"
          ? await createQuote(form)
          : quote
            ? await updateQuote(quote.id, form)
            : { error: "Missing quote" };

      if (res && "error" in res && res.error) {
        setErr(res.error);
        return;
      }
      if (res && "id" in res && res.id) {
        router.push(`/quotes/${res.id}`);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-6">
      {err && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{err}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">Company name *</span>
          <input
            required
            value={form.company_name}
            onChange={(e) => update("company_name", e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">Contact name</span>
          <input
            value={form.contact_name}
            onChange={(e) => update("contact_name", e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">Contact number</span>
          <input
            value={form.contact_number}
            onChange={(e) => update("contact_number", e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">RFQ date</span>
          <input
            type="date"
            value={form.rfq_date}
            onChange={(e) => update("rfq_date", e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">Quote sent date</span>
          <input
            type="date"
            value={form.quote_sent_date}
            onChange={(e) => update("quote_sent_date", e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">Quote value (SGD)</span>
          <input
            inputMode="decimal"
            value={form.quote_value_sgd}
            onChange={(e) => update("quote_value_sgd", e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">Profit (SGD)</span>
          <input
            inputMode="decimal"
            value={form.profit_sgd}
            onChange={(e) => update("profit_sgd", e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
            Brand / product description
          </span>
          <textarea
            rows={3}
            value={form.brand_description}
            onChange={(e) => update("brand_description", e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">Payment terms</span>
          <select
            value={form.payment_terms}
            onChange={(e) => update("payment_terms", e.target.value as PaymentTerms)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            {PAYMENT_TERMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">Status</span>
          <select
            value={form.status}
            onChange={(e) => update("status", e.target.value as QuoteStatus)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            {QUOTE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-xs text-zinc-500">
        Day 3, 7, 14, and 21 follow-up dates are calculated from the quote sent date when you save.
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
        >
          {pending ? "Saving…" : mode === "create" ? "Create quote" : "Save changes"}
        </button>
        <Link
          href={quote ? `/quotes/${quote.id}` : "/quotes"}
          className="rounded-md border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

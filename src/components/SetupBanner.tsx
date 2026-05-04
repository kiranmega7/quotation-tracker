export function SetupBanner() {
  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
      <p className="font-medium text-amber-50">Supabase environment variables are missing.</p>
      <p className="mt-1 text-amber-100/90">
        Copy <code className="rounded bg-black/30 px-1.5 py-0.5 text-xs">.env.local.example</code> to{" "}
        <code className="rounded bg-black/30 px-1.5 py-0.5 text-xs">.env.local</code> and add your project URL and anon
        key. Run <code className="rounded bg-black/30 px-1.5 py-0.5 text-xs">supabase/schema.sql</code> in the Supabase
        SQL editor.
      </p>
    </div>
  );
}

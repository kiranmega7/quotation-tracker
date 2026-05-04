import Link from "next/link";

export default function QuoteNotFound() {
  return (
    <div className="space-y-4 text-center">
      <h1 className="text-xl font-semibold text-zinc-100">Quote not found</h1>
      <Link href="/quotes" className="text-sky-400 hover:underline">
        Back to quotes
      </Link>
    </div>
  );
}

import Link from "next/link";
import { EmptyState } from "@/components/shared";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f4f5] p-6">
      <EmptyState
        title="A little off the beaten path."
        description="Let’s get you back to your studio."
        action={
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-[#1e1e20] px-4 text-[11px] font-semibold text-white transition hover:bg-[#424246]"
            href="/"
          >
            Back to calendar
          </Link>
        }
      />
    </div>
  );
}

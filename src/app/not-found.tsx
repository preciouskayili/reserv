import Link from "next/link";
import { EmptyState } from "@/components/shared";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <EmptyState
        title="A little off the beaten path."
        description="Let’s get you back to your studio."
        action={
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-primary px-4 text-[11px] font-semibold text-primary-foreground transition hover:bg-primary/90"
            href="/"
          >
            Back to calendar
          </Link>
        }
      />
    </div>
  );
}

import type { ReactNode } from "react";
import { Skeleton } from "./skeleton";

export function DataTable({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="data-table-scroll" role="region" aria-label={label} tabIndex={0}>
      <table className="data-table">
        <caption className="sr-only">{label}</caption>
        {children}
      </table>
    </div>
  );
}

export function TableSummary({ count, noun }: { count: number; noun: string }) {
  return (
    <div className="table-summary">
      <span role="status">{count} {noun}{count === 1 ? "" : "s"}</span>
      {count > 0 && <span className="text-[11px] sm:hidden">Scroll sideways for more details</span>}
    </div>
  );
}

export function DataTableSkeleton({
  rows = 5,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="data-table-scroll" role="region" aria-label="Loading table data" tabIndex={0} aria-busy="true">
      <table className="data-table">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} scope="col">
                <Skeleton className={`h-3.5 ${i === 0 ? "w-24" : i === columns - 1 ? "ml-auto w-12" : "w-20"}`} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              <td>
                <span className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </span>
              </td>
              <td>
                <Skeleton className="h-3.5 w-24" />
              </td>
              <td>
                <Skeleton className="h-3.5 w-16" />
              </td>
              <td>
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </td>
              <td className="text-right">
                <Skeleton className="ml-auto h-7 w-14 rounded-lg" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

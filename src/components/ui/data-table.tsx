import type { ReactNode } from "react";

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

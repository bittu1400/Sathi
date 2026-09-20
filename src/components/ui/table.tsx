import * as React from "react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  numeric?: boolean;
  /** Set to make the header a sort button; the parent owns the sort state. */
  sortKey?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  caption: string;
  sort?: { key: string; dir: "asc" | "desc"; onSort: (key: string) => void };
  dense?: boolean;
  className?: string;
}

/** Desktop table. Below 768 px use `TableCards`. */
export function Table<T>({ columns, rows, rowKey, caption, sort, dense, className }: TableProps<T>) {
  return (
    <div className={cn("overflow-x-auto rounded-[var(--radius-lg)] border border-line", className)}>
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 bg-surface">
          <tr className="border-b border-line-strong">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                aria-sort={sort && c.sortKey === sort.key ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                className={cn("px-3 py-2 text-label text-text-muted", c.numeric && "text-right")}
              >
                {sort && c.sortKey ? (
                  <button type="button" className="cursor-pointer uppercase" onClick={() => sort.onSort(c.sortKey!)}>
                    {c.header}
                  </button>
                ) : (
                  c.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className={cn("border-b border-line last:border-0", dense ? "h-10" : "h-11")}>
              {columns.map((c) => (
                <td key={c.key} className={cn("px-3 text-body", c.numeric && "text-right font-mono tabular-nums")}>
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Same data as `Table`, one definition list per row, for narrow screens. */
export function TableCards<T>({ columns, rows, rowKey, className }: Pick<TableProps<T>, "columns" | "rows" | "rowKey" | "className">) {
  return (
    <ul className={cn("divide-y divide-line rounded-[var(--radius-lg)] border border-line bg-surface", className)}>
      {rows.map((row) => (
        <li key={rowKey(row)} className="p-4">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            {columns.map((c) => (
              <React.Fragment key={c.key}>
                <dt className="text-small text-text-muted">{c.header}</dt>
                <dd className={cn("text-right text-body", c.numeric && "font-mono tabular-nums")}>{c.cell(row)}</dd>
              </React.Fragment>
            ))}
          </dl>
        </li>
      ))}
    </ul>
  );
}

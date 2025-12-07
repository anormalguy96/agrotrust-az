// agrotrust-az/src/components/common/Table.tsx

import type { ReactNode } from "react";

type Align = "left" | "center" | "right";

export type TableColumn<T> = {
  key: string;
  header: ReactNode;
  render?: (row: T, index: number) => ReactNode;
  className?: string;
  align?: Align;
  width?: string | number;
};

export type TableProps<T> = {
  columns: Array<TableColumn<T>>;
  data: T[];

  /**
   * Optional helpers for better DX
   */
  caption?: ReactNode;
  getRowKey?: (row: T, index: number) => string;

  /**
   * Simple built-in states for Hackathon MVP
   */
  loading?: boolean;
  error?: ReactNode;
  emptyMessage?: ReactNode;

  /**
   * Styling
   */
  className?: string;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * Table
 *
 * Lightweight, generic table component that aligns with the global `.table`
 * utility class used across the app.
 *
 * It is safe to use this now or later in feature modules without additional
 * dependencies.
 */
export function Table<T>({
  columns,
  data,
  caption,
  getRowKey,
  loading = false,
  error,
  emptyMessage = "No data available.",
  className
}: TableProps<T>) {
  const colCount = Math.max(columns.length, 1);

  return (
    <table className={cx("table", className)}>
      {caption ? <caption className="table__caption">{caption}</caption> : null}

      <colgroup>
        {columns.map((c) => (
          <col
            key={c.key}
            style={
              c.width
                ? { width: typeof c.width === "number" ? `${c.width}px` : c.width }
                : undefined
            }
          />
        ))}
      </colgroup>

      <thead>
        <tr>
          {columns.map((c) => (
            <th
              key={c.key}
              className={c.className}
              style={{ textAlign: c.align ?? "left" }}
              scope="col"
            >
              {c.header}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {loading && (
          <tr>
            <td colSpan={colCount} className="table__state">
              Loading…
            </td>
          </tr>
        )}

        {!loading && error && (
          <tr>
            <td colSpan={colCount} className="table__state">
              {error}
            </td>
          </tr>
        )}

        {!loading && !error && data.length === 0 && (
          <tr>
            <td colSpan={colCount} className="table__state">
              {emptyMessage}
            </td>
          </tr>
        )}

        {!loading &&
          !error &&
          data.map((row, i) => {
            const key = getRowKey ? getRowKey(row, i) : String(i);

            return (
              <tr key={key}>
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={c.className}
                    style={{ textAlign: c.align ?? "left" }}
                  >
                    {c.render ? c.render(row, i) : (row as any)?.[c.key]}
                  </td>
                ))}
              </tr>
            );
          })}
      </tbody>
    </table>
  );
}
import type { ReactNode } from 'react';

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  empty: string;
};

export function DataTable<T>({ columns, rows, rowKey, empty }: Props<T>) {
  if (!rows.length) return <p>{empty}</p>;

  return (
    <table>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.key} scope="col">{column.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={rowKey(row)}>
            {columns.map((column) => (
              <td key={column.key}>{column.cell(row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

'use client';

import type { MatrixRow } from '@/lib/admin/variant-matrix';

type Props = {
  rows: MatrixRow[];
  onRowChange: (key: string, patch: Partial<MatrixRow>) => void;
};

export function VariantMatrix({ rows, onRowChange }: Props) {
  if (!rows.length) {
    return <p>Add at least one size and one colour to generate variants.</p>;
  }

  return (
    <table>
      <caption>Variants</caption>
      <thead>
        <tr>
          <th scope="col">Size</th>
          <th scope="col">Colour</th>
          <th scope="col">SKU</th>
          <th scope="col">Price (cents)</th>
          <th scope="col">Stock</th>
          <th scope="col">Enabled</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key} data-orphan={row.orphan || undefined}>
            <td>{row.size}</td>
            <td>{row.color}{row.orphan ? ' (removed option)' : ''}</td>
            <td>
              <input
                aria-label={`SKU for ${row.size} ${row.color}`}
                value={row.sku}
                onChange={(event) => onRowChange(row.key, { sku: event.target.value })}
              />
            </td>
            <td>
              <input
                type="number" min={0} step={1}
                aria-label={`Price for ${row.size} ${row.color}`}
                value={row.priceCents}
                onChange={(event) => onRowChange(row.key, { priceCents: Number(event.target.value) })}
              />
            </td>
            <td>
              <input
                type="number" min={0} step={1}
                aria-label={`Stock for ${row.size} ${row.color}`}
                value={row.stock}
                onChange={(event) => onRowChange(row.key, { stock: Number(event.target.value) })}
              />
            </td>
            <td>
              <input
                type="checkbox"
                aria-label={`Enable ${row.size} ${row.color}`}
                checked={row.enabled}
                onChange={(event) => onRowChange(row.key, { enabled: event.target.checked })}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

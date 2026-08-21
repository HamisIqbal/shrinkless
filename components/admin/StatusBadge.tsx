export function StatusBadge({ status }: { status: string }) {
  return <span data-status={status}>{status.replace('_', ' ')}</span>;
}

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminResult } from '@/lib/admin/action';
import type { OrderNoteDTO } from '@/types/dto';

type NoteAction = (input: { id: string; body: string }) => Promise<AdminResult<undefined>>;

/**
 * Internal notes, shared by orders and customers.
 *
 * Notes are append-only by design: an editable note is a note nobody can rely
 * on later. If something was wrong, the correction is another note.
 */
export function NotesPanel({
  id,
  notes,
  action,
  heading = 'Notes',
}: {
  id: string;
  notes: OrderNoteDTO[];
  action: NoteAction;
  heading?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState('');
  const [error, setError] = useState('');

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    startTransition(async () => {
      const result = await action({ id, body });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setBody('');
      router.refresh();
    });
  }

  return (
    <div className="notespanel">
      <h2>{heading}</h2>
      <p>Staff only. Customers never see these.</p>

      {notes.length ? (
        <ul>
          {notes.map((note) => (
            <li key={note.id}>
              <p>{note.body}</p>
              <small>
                {note.actorEmail} — {new Date(note.at).toLocaleString('en-US')}
              </small>
            </li>
          ))}
        </ul>
      ) : (
        <p>No notes yet.</p>
      )}

      <form onSubmit={submit}>
        <label>
          <span className="visually-hidden">New note</span>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={3}
            placeholder="What happened, and what you did about it"
            required
          />
        </label>

        <button type="submit" disabled={pending || !body.trim()}>
          {pending ? 'Saving…' : 'Add note'}
        </button>
      </form>

      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}

import { z } from 'zod';

import { LONG_MAX, isKnownContentKey } from '@/lib/services/site-content';

/**
 * A content field's key.
 *
 * Checked against the registry here as well as in the service, so a request
 * naming a field the site does not have is turned away at the edge with a
 * message a person can read, rather than reaching the database.
 */
const key = z
  .string()
  .trim()
  .min(1, 'A field is required')
  .refine(isKnownContentKey, 'That is not a field this site has');

/**
 * The wording itself.
 *
 * Bounded at the longest any field takes; the service applies the tighter
 * limit a heading or a button actually has, because that one depends on which
 * field this is and the schema does not know yet. Empty is refused outright:
 * a blank heading is a hole in the page, and "remove this wording" is
 * `resetContentFieldAction`, which puts back what the site shipped with.
 */
const value = z
  .string()
  .trim()
  .min(1, 'This cannot be empty')
  .max(LONG_MAX, `That is longer than ${LONG_MAX} characters`);

export const contentFieldInputSchema = z.object({ key, value });

export const contentKeySchema = z.object({ key });

export type ContentFieldInput = z.infer<typeof contentFieldInputSchema>;

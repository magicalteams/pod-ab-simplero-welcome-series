import { z } from 'zod';

/**
 * Shape based on Simplero's Zapier poll docs.
 * Using .passthrough() until we capture a real webhook payload via webhook.site.
 * Once the real shape is confirmed, tighten this schema and remove .passthrough().
 */
export const SimpleroTaggingPayloadSchema = z
  .object({
    id: z.number(),
    email: z.string().email(),
    name: z.string().optional(),
    tag_names: z.string().optional(),
  })
  .passthrough();

export type SimpleroTaggingPayload = z.infer<typeof SimpleroTaggingPayloadSchema>;

import { z } from 'zod';

export const BookFrontmatterSchema = z.object({
  title: z.string(),
  author: z.string(),
  status: z.enum(['reading', 'finished', 'abandoned', 'want-to-read']),
  started: z.string().date(),
  finished: z.string().date().optional(),
  cover: z.string().optional(),
  rating: z.number().optional(),
});

export type BookFrontmatter = z.infer<typeof BookFrontmatterSchema>;

export type Book = BookFrontmatter & {
  slug: string;
};

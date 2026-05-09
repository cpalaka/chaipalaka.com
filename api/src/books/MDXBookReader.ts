import { readdir, readFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import matter from 'gray-matter';
import { BookFrontmatterSchema, type Book } from './schema';

const STATUS_PRIORITY: Record<string, number> = {
  reading: 0,
  'want-to-read': 1,
  finished: 2,
  abandoned: 3,
};

function sortBooks(books: Book[]): Book[] {
  return books.slice().sort((a, b) => {
    const pa = STATUS_PRIORITY[a.status] ?? 99;
    const pb = STATUS_PRIORITY[b.status] ?? 99;
    if (pa !== pb) return pa - pb;
    const da = a.finished ?? a.started;
    const db = b.finished ?? b.started;
    return db.localeCompare(da);
  });
}

export function createMDXBookReader({ booksDir }: { booksDir: string }) {
  return {
    async read(): Promise<Book[]> {
      const entries = await readdir(booksDir);
      const mdxFiles = entries.filter(f => f.endsWith('.mdx') || f.endsWith('.md'));

      const books: Book[] = await Promise.all(
        mdxFiles.map(async (file) => {
          const raw = await readFile(join(booksDir, file), 'utf-8');
          const { data } = matter(raw);
          const frontmatter = BookFrontmatterSchema.parse(data);
          const slug = basename(file).replace(/\.(mdx|md)$/, '');
          return { slug, ...frontmatter };
        }),
      );

      return sortBooks(books);
    },
  };
}

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { z } from 'zod';
import { BookFrontmatterSchema } from './schema';
import { createMDXBookReader } from './MDXBookReader';

// --- Schema tests ---

describe('BookFrontmatterSchema', () => {
  it('throws ZodError when required fields are missing', () => {
    expect(() => BookFrontmatterSchema.parse({})).toThrow(z.ZodError);
  });

  it('accepts a full valid book record', () => {
    const result = BookFrontmatterSchema.parse({
      title: 'The Pragmatic Programmer',
      author: 'Andrew Hunt',
      status: 'reading',
      started: '2026-01-15',
      finished: '2026-04-01',
      cover: './cover.jpg',
      rating: 5,
    });
    expect(result.title).toBe('The Pragmatic Programmer');
    expect(result.status).toBe('reading');
  });

  it('allows optional fields to be absent', () => {
    const result = BookFrontmatterSchema.parse({
      title: 'SICP',
      author: 'Abelson',
      status: 'want-to-read',
      started: '2026-03-01',
    });
    expect(result.finished).toBeUndefined();
    expect(result.cover).toBeUndefined();
    expect(result.rating).toBeUndefined();
  });
});

// --- MDXBookReader tests ---

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'books-test-'));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

function writeMdx(slug: string, frontmatter: Record<string, unknown>, body = ''): Promise<void> {
  const fm = Object.entries(frontmatter)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join('\n');
  return writeFile(join(tmpDir, `${slug}.mdx`), `---\n${fm}\n---\n${body}`);
}

describe('MDXBookReader.read()', () => {
  it('parses frontmatter from a single valid MDX file', async () => {
    await writeMdx('pragmatic-programmer', {
      title: 'The Pragmatic Programmer',
      author: 'Andrew Hunt',
      status: 'reading',
      started: '2026-01-15',
    });

    const reader = createMDXBookReader({ booksDir: tmpDir });
    const books = await reader.read();

    expect(books).toHaveLength(1);
    const [book] = books;
    expect(book?.slug).toBe('pragmatic-programmer');
    expect(book?.title).toBe('The Pragmatic Programmer');
    expect(book?.author).toBe('Andrew Hunt');
    expect(book?.status).toBe('reading');
  });

  it('sorts by status priority then date descending', async () => {
    await writeMdx('book-a', {
      title: 'Finished Early',
      author: 'A',
      status: 'finished',
      started: '2025-01-01',
      finished: '2025-06-01',
    });
    await writeMdx('book-b', {
      title: 'Currently Reading',
      author: 'B',
      status: 'reading',
      started: '2026-03-01',
    });
    await writeMdx('book-c', {
      title: 'Finished Later',
      author: 'C',
      status: 'finished',
      started: '2025-07-01',
      finished: '2026-01-01',
    });
    await writeMdx('book-d', {
      title: 'Want To Read',
      author: 'D',
      status: 'want-to-read',
      started: '2026-05-01',
    });

    const reader = createMDXBookReader({ booksDir: tmpDir });
    const books = await reader.read();

    // Status order: reading > want-to-read > finished > abandoned
    const [b0, b1, b2, b3] = books;
    expect(b0?.title).toBe('Currently Reading');   // reading
    expect(b1?.title).toBe('Want To Read');        // want-to-read
    // Within 'finished': Finished Later (2026-01-01) before Finished Early (2025-06-01)
    expect(b2?.title).toBe('Finished Later');
    expect(b3?.title).toBe('Finished Early');
  });

  it('throws ZodError when a file has a missing required field', async () => {
    await writeMdx('bad-book', {
      // missing 'title'
      author: 'Nobody',
      status: 'reading',
      started: '2026-01-01',
    });

    const reader = createMDXBookReader({ booksDir: tmpDir });
    await expect(reader.read()).rejects.toThrow(z.ZodError);
  });
});

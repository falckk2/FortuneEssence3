/**
 * ISSUE-010: not-found and error pages must include dark: Tailwind overrides.
 */

import fs from 'fs';
import path from 'path';

function readSrc(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

function countDarkVariants(source: string): number {
  return (source.match(/dark:/g) || []).length;
}

describe('dark mode error pages (ISSUE-010)', () => {
  it('not-found.tsx has dark: overrides on key surfaces', () => {
    const source = readSrc('src/app/not-found.tsx');
    expect(source).toMatch(/bg-cream-50 dark:bg-\[#1a1f1e\]/);
    expect(source).toMatch(/text-forest-800 dark:text-\[#E8EDE8\]/);
    expect(source).toMatch(/dark:bg-\[#242a28\]/);
    expect(source).toMatch(/dark:border-\[#3f4946\]/);
    expect(source).toMatch(/dark:text-sage-400/);
    expect(countDarkVariants(source)).toBeGreaterThanOrEqual(8);
  });

  it('error.tsx has dark: overrides including error styling', () => {
    const source = readSrc('src/app/error.tsx');
    expect(source).toMatch(/bg-cream-50 dark:bg-\[#1a1f1e\]/);
    expect(source).toMatch(/dark:bg-red-900\/30/);
    expect(source).toMatch(/dark:text-red-400/);
    expect(source).toMatch(/dark:bg-\[#242a28\]/);
    expect(countDarkVariants(source)).toBeGreaterThanOrEqual(10);
  });
});
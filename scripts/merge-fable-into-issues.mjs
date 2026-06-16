/**
 * One-time merge: fable_issues.md → issues.md as ISSUE-051..068
 * Run: node scripts/merge-fable-into-issues.mjs
 */
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const FABLE_START = 1;
const ISSUE_START = 51;

const CATEGORY_MAP = {
  'Logic Bug / Regression': 'Bug',
  'Logic Bug': 'Bug',
  'Logic Bug / Missing Database Object': 'Bug',
  'Dead Code': 'Bug',
  'Style/Pattern': 'Other',
  Configuration: 'Other',
  SEO: 'Other',
  'Database Configuration / Latent Production Bug': 'Integration',
  Security: 'Security',
};

const SECTION_NAMES = [
  'Description',
  'Relevant Code',
  'Suggested Solution',
  'Resolution Notes',
  'Verification Record',
];

function fableToIssue(n) {
  return `ISSUE-${String(ISSUE_START + n - FABLE_START).padStart(3, '0')}`;
}

function replaceFableRefs(text) {
  let out = text;
  for (let i = 18; i >= 1; i--) {
    out = out.replaceAll(`FABLE-${String(i).padStart(3, '0')}`, fableToIssue(i));
  }
  return out;
}

function extractSection(block, name) {
  const marker = `**${name}:**`;
  const start = block.indexOf(marker);
  if (start === -1) return '';
  let bodyStart = start + marker.length;
  if (block[bodyStart] === '\r') bodyStart++;
  if (block[bodyStart] === '\n') bodyStart++;

  let bodyEnd = block.length;
  for (const other of SECTION_NAMES) {
    if (other === name) continue;
    const otherMarker = `**${other}:**`;
    const pos = block.indexOf(otherMarker, bodyStart);
    if (pos !== -1 && pos < bodyEnd) bodyEnd = pos;
  }
  return block.slice(bodyStart, bodyEnd).trimEnd();
}

function parseFableIssues(content) {
  const normalized = content.replace(/\r\n/g, '\n');
  const issuesSection = normalized.split('## Issues')[1] ?? normalized;
  const blocks = issuesSection.split('\n---\n').filter((b) => /### \[FABLE-\d+\]/.test(b));
  const issues = [];

  for (const block of blocks) {
    const heading = block.match(/### \[(FABLE-\d+)\] (.+)/);
    if (!heading) continue;

    const fableId = heading[1];
    const title = heading[2].trim();
    const fableNum = parseInt(fableId.replace('FABLE-', ''), 10);
    const issueId = fableToIssue(fableNum);

    const status = block.match(/- \*\*Status:\*\* (.+)/)?.[1]?.trim() ?? 'Resolved';
    const resolved = block.match(/- \*\*Resolved:\*\* (.+)/)?.[1]?.trim();
    const severity = block.match(/- \*\*Severity:\*\* (.+)/)?.[1]?.trim() ?? 'Medium';
    const rawCategory = block.match(/- \*\*Category:\*\* (.+)/)?.[1]?.trim() ?? 'Other';
    const category = CATEGORY_MAP[rawCategory] ?? 'Other';
    const file = block.match(/- \*\*File:\*\* (.+)/)?.[1]?.trim() ?? 'unknown';
    const detected = block.match(/- \*\*Detected:\*\* (.+)/)?.[1]?.trim() ?? '2026-06-10';

    const extracted = Object.fromEntries(
      SECTION_NAMES.map((name) => [name, extractSection(block, name)])
    );

    const resolvedLine = resolved ? `- **Resolved:** ${resolved}\n` : '';

    let issueBlock = `### [${issueId}] ${replaceFableRefs(title)}
- **Status:** ${status}
- **Severity:** ${severity}
- **Category:** ${category}
- **File:** ${file}
- **Detected:** ${detected}
${resolvedLine}
**Description:**
${replaceFableRefs(extracted.Description)}

**Relevant Code:**
${replaceFableRefs(extracted['Relevant Code'])}

**Suggested Solution:**
${replaceFableRefs(extracted['Suggested Solution'])}

**Resolution Notes:**
${replaceFableRefs(extracted['Resolution Notes'])}

**Verification Record:**
${replaceFableRefs(extracted['Verification Record'])}
`;

    issues.push({ fableNum, issueId, block: issueBlock.trimEnd() });
  }

  return issues.sort((a, b) => a.fableNum - b.fableNum);
}

const fablePath = resolve(root, 'fable_issues.md');
const issuesPath = resolve(root, 'issues.md');

if (!existsSync(fablePath)) {
  console.error('fable_issues.md not found');
  process.exit(1);
}

const fableContent = readFileSync(fablePath, 'utf8');
let issuesContent = readFileSync(issuesPath, 'utf8');

// Remove any prior merged tail (ISSUE-051+)
const mergeStart = issuesContent.search(/\n---\n\n### \[ISSUE-051\]/);
if (mergeStart !== -1) {
  issuesContent = issuesContent.slice(0, mergeStart).trimEnd() + '\n';
}

const parsed = parseFableIssues(fableContent);
if (parsed.length !== 18) {
  console.error(`Expected 18 fable issues, parsed ${parsed.length}`);
  process.exit(1);
}

const followUpComment = `<!-- Merged from fable_issues.md on 2026-06-16 (FABLE-001..018 → ISSUE-051..068).
     Non-blocking follow-ups (not open defects):
     - Human review of English legal texts before legal reliance (ISSUE-061)
     - Delete seed reviews + seed customers once organic reviews exist (ISSUE-053/060; ARCHITECTURE_NOTES §3)
     - Check Fable DB migrations into database/migrations/ — several applied directly to Supabase
       (ISSUE-053, 063, 065, 066, 068); 015_create_return_with_items_rpc.sql drifts from production (ISSUE-067)
     - Re-run Supabase security advisor when convenient (ISSUE-063, 065, 066) -->`;

const newSummary = `## Summary
- Total Issues: 68
- Open: 0 | In Progress: 0 | Fixed (Pending Verification): 0 | Resolved: 68 | Partially Resolved: 0 | Blocked: 0 | Wont Fix: 0
`;

issuesContent = issuesContent
  .replace(/_Last updated:.*_\n/, '_Last updated: 2026-06-16 (merged fable_issues.md as ISSUE-051..068)_\n')
  .replace(
    /## Summary\r?\n- Total Issues:[\s\S]*?(?=\r?\n(?:<!--|\r?\n---))/,
    `${newSummary}\n${followUpComment}\n`
  );

const mergedSection = parsed.map((i) => i.block).join('\n\n---\n\n');
const updated = `${issuesContent.trimEnd()}\n\n---\n\n${mergedSection}\n`;

writeFileSync(issuesPath, updated, 'utf8');
unlinkSync(fablePath);

// Spot-check first issue has description body
const sample = parsed[0].block;
if (!sample.includes('ISSUE-022 fix')) {
  console.error('Sanity check failed: ISSUE-051 description missing');
  process.exit(1);
}

console.log(`Merged ${parsed.length} issues into issues.md (ISSUE-051..${fableToIssue(18)})`);
console.log('Deleted fable_issues.md');
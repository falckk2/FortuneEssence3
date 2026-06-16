# Standardised Issues Format

This document defines how `issues.md` must be structured so the three pipeline agents can read and write it consistently:

| Agent | Role |
|-------|------|
| `debug-logger` | Find issues, add/remove diagnostic logging, record findings |
| `issue-resolver` | Fix issues listed in `issues.md` |
| `test-validator` | Test and verify fixes |

All three agents **must read this file** before modifying `issues.md`.

---

## File Location

- **Registry:** `issues.md` (project root)
- **Format spec:** `standardised_issues_format.md` (this file)

---

## Issue ID Rules

- Format: `ISSUE-NNN` (three-digit, zero-padded, monotonically increasing)
- Example: `ISSUE-025`
- Never reuse or renumber IDs
- New issues: scan existing headings (`### [ISSUE-`) and use `max(NNN) + 1`

---

## Status Values and Workflow

Use exactly one of these status strings:

| Status | Set by | Meaning |
|--------|--------|---------|
| `Open` | debug-logger | Issue found; not yet being fixed |
| `In Progress` | issue-resolver | Fix work underway |
| `Fixed (Pending Verification)` | issue-resolver | Fix applied; awaiting test-validator |
| `Resolved` | test-validator | Fix verified by tests and/or code review |
| `Partially Resolved` | any agent | Fix incomplete or only addresses part of the issue |
| `Blocked` | any agent | Cannot proceed without external input |
| `Wont Fix` | any agent | Deliberately not fixing (document why) |

### Typical pipeline

```
debug-logger          issue-resolver              test-validator
     |                      |                           |
  Open  ──────────►  In Progress  ──────────►  Fixed (Pending Verification)
                                                      |
                                                      ▼
                                                 Resolved
```

### Agent-specific status rules

- **debug-logger:** Creates issues as `Open`. May set `Partially Resolved`, `Blocked`, or `Wont Fix` after reviewing a fix. Does **not** set `Resolved`.
- **issue-resolver:** Moves `Open` → `In Progress` → `Fixed (Pending Verification)`. Does **not** set `Resolved`.
- **test-validator:** Moves `Fixed (Pending Verification)` → `Resolved` (or `Partially Resolved` / `Blocked`). Does **not** create new issues.

---

## Document Structure

```markdown
# Issue Registry
_Last updated: YYYY-MM-DD_

## Summary
- Total Issues: N
- Open: X | In Progress: X | Fixed (Pending Verification): X | Resolved: X | Partially Resolved: X | Blocked: X | Wont Fix: X

---

## Issues

### [ISSUE-NNN] Short descriptive title
- **Status:** <status>
- **Severity:** Critical | High | Medium | Low
- **Category:** Security | Bug | Integration | Performance | UX | Testing | Logging | Other
- **File:** `path/to/file.ts` (line N or line range)
- **Detected:** YYYY-MM-DD
- **Resolved:** YYYY-MM-DD _(omit until test-validator sets Resolved)_

**Description:**
What is wrong, observable symptoms, and impact.

**Relevant Code:**
```lang
// minimal snippet showing the problem
```

**Suggested Solution:**
Concrete steps another agent should take. Written by debug-logger; issue-resolver may append notes but must not delete the original suggestion.

**Logging Notes:** _(optional — debug-logger only)_
What logging was added or removed, log file paths, and what to look for in logs.

**Resolution Notes:** _(issue-resolver only)_
What was changed, which files, and why. Include before/after behaviour.

**Debug Review:** _(optional — debug-logger only, after a fix)_
Whether the fix appears to address the root cause from a debugging perspective. Not a substitute for test validation.

**Verification Record:** _(test-validator only)_
- **Date:** YYYY-MM-DD
- **Method:** Automated Test | Manual Test | Code Inspection | Combined
- **Verdict:** Resolved | Partially Resolved | Not Resolved
- **Evidence:** Test file paths, commands run, pass/fail output, or code locations inspected
- **Details:** What was tested and what behaviour was confirmed
- **Remaining Concerns:** None, or list outstanding risks

**Blocked Notes:** _(when Status is Blocked)_
What is needed (supervisor decision, API key, third-party change, etc.) and from whom.

---
```

---

## Field Ownership

| Section | debug-logger | issue-resolver | test-validator |
|---------|:---:|:---:|:---:|
| Title, Description, Relevant Code, Suggested Solution | create/edit | read | read |
| Logging Notes | create/edit | read | read |
| Severity, Category, File, Detected | create/edit | read | read |
| Status → Open | ✓ | | |
| Status → In Progress / Fixed (Pending Verification) | | ✓ | |
| Status → Resolved / Partially Resolved (post-verify) | | | ✓ |
| Resolution Notes | | create/edit | read |
| Debug Review | create/edit | read | read |
| Verification Record | | | create/edit |
| Blocked Notes | create/edit | create/edit | create/edit |

**Never delete another agent's sections.** Append updates; strike through outdated text only when replacing your own section.

---

## Summary Block

After any change to an issue, recompute the `## Summary` counts from all issue statuses. Keep counts accurate — agents use this to find work:

- **debug-logger:** look for nothing new to create; optionally review `Fixed (Pending Verification)` issues
- **issue-resolver:** look for `Open` issues
- **test-validator:** look for `Fixed (Pending Verification)` issues

---

## Logging Code Rules (debug-logger)

When adding diagnostic logging:

- Prefer structured, searchable messages with a consistent prefix, e.g. `[DEBUG-ISSUE-025]`
- Log to existing project conventions (console, logger utility, file) — document in **Logging Notes**
- Remove temporary/noisy logging once the issue is `Resolved`, unless the log is a permanent guard
- **Do not change business logic** — only add, adjust, or remove logging/instrumentation

---

## Fix Rules (issue-resolver)

- Work only from issues already in `issues.md` — do not scout for new issues
- Implement the **Suggested Solution** unless you document why an alternative was necessary in **Resolution Notes**
- Set status to `Fixed (Pending Verification)` when done — never `Resolved`
- If blocked, set `Blocked` and fill **Blocked Notes**

---

## Verification Rules (test-validator)

- Primary method: **write and run automated tests** covering the fix
- Secondary method: targeted code inspection when tests are impractical
- Set **Verdict** in Verification Record; update top-level **Status** to match:
  - Verdict `Resolved` → Status `Resolved`, set **Resolved** date
  - Verdict `Partially Resolved` or `Not Resolved` → Status `Partially Resolved`, detail gaps in **Remaining Concerns**
- Do **not** fix production code — report failures back via **Verification Record** and status

---

## Invoking the Pipeline

Ask the main Grok session to orchestrate the three agents in order:

```
Run the issue pipeline on [scope]:
1. debug-logger — scan for issues and update issues.md
2. issue-resolver — fix all Open issues
3. test-validator — verify all Fixed (Pending Verification) issues
```

Agents may also be spawned individually:

```
/debug-logger scan src/app/api/ for auth issues
/issue-resolver fix ISSUE-025
/test-validator verify ISSUE-025
```

Use `resume_from` when chaining context between agents on the same issue batch.
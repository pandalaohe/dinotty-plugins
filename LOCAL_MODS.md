# Local Modifications Registry

> Fork: pandalaohe/dinotty-plugins (custom branch)
> Upstream: xichan96/dinotty-plugins (main branch)
> Running branch: custom
> Registry format version: 1
> Bootstrap date: 2026-07-16
> Bootstrap upstream commit hash: a2a670fde14419ed116b2afc6ebc9b996123205c  (canonical_base source for D2-origin mods)
> Last updated: 2026-07-18

---

## Committed Modifications

| Commit | File | Area | What | Why | upstreamable | exit-condition | upstream_issue | upstream_pr | status |
|--------|------|------|------|-----|--------------|----------------|----------------|-------------|--------|
| 8ea935c | `session-browser/` | plugin | Read-only Claude Code session browser (browse/search/resume/rename/archive-restore; i18n zh/en; 99/99 tests). Originally added at `cc-session-browser/`, then path-renamed in 99ef7ad; diff verification from a2a670f shows 0 lines under the old path and 16,794 under the new path. | Provide a focused history browser/manager without chat functionality | yes | Landed via PR #1; retain for traceability because upstream/main still uses `cc-session-browser/` while this fork renamed the directory to `session-browser/` | n/a | xichan96/dinotty-plugins#1 (merged via 939928c) | merged-upstream |
| 3f196c6, d720f12, a74b4da, f05243d, ea2ae8e, 2a34fe9 | `session-browser/src/codex-connector.ts`, `src/history-cli.ts`, `src/ui.ts` | feature | Multi-agent support: connector registry normalizing each agent's native storage into one shared session schema, plus a per-connector capability descriptor driving UI affordances. Codex connector reads `~/.codex/state_5.sqlite` read-only via `node:sqlite` `DatabaseSync` (zero runtime deps, never writes the live DB), uses Codex's native title/preview/archived/recency instead of this plugin's Claude-Code-specific index cache, mutates only through the official `codex archive\|unarchive\|delete` CLI, and resumes via `codex resume <id>` in the recorded workspace. UI gains a persistent agent switcher and a set-selected-folder-as-tree-root button. | Make the browser usable for Codex sessions without reimplementing Codex state or inventing a plugin API | yes | Drop the local carry once PR #3 merges | n/a | xichan96/dinotty-plugins#3 (open) | candidate |
| 99ef7ad, 55e1388 | `session-browser/` | plugin identity | Renames the plugin id and directory from `cc-session-browser` to `session-browser` because it is no longer Claude-Code-only. dinotty's plugin scan requires the directory name to equal the manifest id exactly and keys settings by id, so the CLI copies missing legacy settings forward on first run (copy-if-absent, never overwrites). Fork-local only: root `registry.json` deliberately stays pointed at upstream subdir `cc-session-browser` (repointing it would break that path for this fork); the upstream PR changes `registry.json` instead, because there the rename IS upstream. Intentional residuals: internal `ccm-` CSS prefix (~1075 occurrences, selector churn has no user-visible benefit and real breakage risk) and `CC_SB_*` environment variable names. | Keep the plugin identity aligned with its multi-agent scope | yes | Drop the local carry once PR #3 merges; if upstream declines the rename, re-cut the PR without it and keep this row `private` | n/a | xichan96/dinotty-plugins#3 (open) | candidate |

> ⚠️ `why` 字段由 upstream-update Phase D2 bootstrap 逐条询问 user 填写。
> 首次生成时可能标为 `why_placeholder_fill_me` — 务必编辑后再跑升级，否则 Phase C triage 质量下降（Per-mod UNCERTAIN 率上升）。

## Contribution Lifecycle Fields (fixed-field schema — canonical home, referenced by W3)

| Field | Domain | Semantics |
|-------|--------|-----------|
| `upstreamable` | `yes\|no\|maybe` (blank = unknown) | human verdict, set directly by W3 commit-time classification: contributable→`yes`, private→`no`, unclear→`maybe` |
| `exit-condition` | free text | P8 exit condition; human-read only, never machine-parsed |
| `upstream_issue` | `blank\|candidate\|<URL>\|n/a` | `candidate` = bug workaround worth filing; URL once filed |
| `upstream_pr` | `blank\|candidate\|<URL>\|n/a` | `candidate` = extraction planned; URL once opened |
| `status` | `private\|candidate\|filed\|merged-upstream\|dropped` (blank = unknown) | lifecycle |

**Status transitions**: default `private`; `upstreamable=yes` → `candidate` (`maybe` stays `private` until resolved to yes/no); `candidate` → `filed` when the contribution PR opens (URL recorded) — issue-only filing records `upstream_issue=<URL>` and never changes `status`; `filed` → `merged-upstream` (row then moves to "Previously Applied") OR, on rejection/closed-unmerged: `dropped` (+reason in exit-condition) or back to `candidate` (explicit retry). `status` is independent of `upstream_issue` progress: issue-only filing does NOT require `status=candidate` — a private workaround with a reportable upstream bug is legitimately `status=private` + `upstream_issue=candidate`.

**Write path (prospective-only)**: a legacy 5-column header is valid and parses as all-unknown. The new columns are appended to the active-table header (blank history cells, one mechanical edit) by the FIRST workflow occasion that needs to record a new-field value in that repo — a commit-time classification or an upstream-update run — performed by the LLM in that session with the edit visible to the user. Never a bulk backfill; history rows stay blank until individually touched.

**Entry scope**: schema fields and bucket derivation apply ONLY to rows of the active "Committed Modifications" table (or labeled entries in prose-style ledgers). "Previously Applied" tables, narrative sections, and upgrade checklists are out of scope.

## Previously Applied (Now in Upstream or Superseded)

| What | Status | Notes |
|------|--------|-------|

## Upgrade Checklist

This registry drives the `upstream-update` skill's per-mod triage (Phase C):

1. Each row becomes one LLM triage input: (files, area, what, why, canonical_base).
2. `commit` column hash preferred as canonical_base source (rule 1 of §Canonical_Base).
3. When Phase C verdict = ADOPT → row moves to "Previously Applied".
4. When Phase C verdict = KEEP_NOTE → row's Notes appended with divergence description.

**Maintenance guidance**:
- Keep row count manageable (<15 — target from Nixpkgs/LineageOS industry practice)
- Periodically PR upstream so rows can move to "Previously Applied"
- If a row's `why` becomes stale (solved by unrelated upstream evolution), mark for removal in next run

# Local Modifications Registry

> Fork: pandalaohe/dinotty-plugins (custom branch)
> Upstream: xichan96/dinotty-plugins (main branch)
> Running branch: custom
> Registry format version: 1
> Bootstrap date: 2026-07-16
> Bootstrap upstream commit hash: a2a670fde14419ed116b2afc6ebc9b996123205c  (canonical_base source for D2-origin mods)
> Last updated: 2026-07-28
> Lineage note: `custom` was rebuilt on 2026-07-19 directly onto upstream `b44464e`, because
> three squash merges (PRs #1/#2/#3) had left the old branch carrying 58 commits whose content
> upstream already held, with a merge-base predating all of them. The pre-rebuild history is
> preserved at tag `pre-upstream-sync-260719` and branch `custom-preSync`; commit hashes in the
> "Previously Applied" table below refer to that lineage.

---

## Committed Modifications

| Commit | File | Area | What | Why | upstreamable | exit-condition | upstream_issue | upstream_pr | status |
|--------|------|------|------|-----|--------------|----------------|----------------|-------------|--------|
| 395ba40 | `session-browser/src/{history-cli,ui,i18n,icons,codex-connector}.ts`, `styles.css`, `README.md`, `test/`, `dist/` | feature | Markdown export for recorded sessions, single and bulk, from the session list and the CLI. Destination root configurable (default `~/Downloads`); outside-home destinations refused unless confirmed. Picker driven by two new read-only CLI subcommands (`list-dirs`, `check-dir`) because the plugin context exposes no file-picker bridge. Filenames capped at 255 bytes with the collision-suffix width reserved inside the budget and the legality pass re-checked after truncation. Publication atomic via hard link. Failures are a localized code taxonomy that structurally cannot surface a raw CLI message. | Let users get transcripts out of the browser without a chat composer or an external tool | yes | Drop the local carry once PR #4 merges | n/a | xichan96/dinotty-plugins#4 (merged 2026-07-20) | merged-upstream |
| bf1f550…995af28 | `session-browser/src/{history-cli,ui,i18n,icons}.ts`, `styles.css`, `test/{pins,pins-ui}.test.js`, `dist/` | feature | Folder pins — pin directories as a peer block above the workspace tree. Clicking a pin scopes the session list without moving the tree; a header Reveal button jumps the tree to the active pin in subtree mode; a checkmark toggle enters edit mode where a whole-row click selects for reorder/removal. Pins persist as content-hash sidecar files written through an atomic-replace path (temp → fsync → rename) with corrupt-sidecar detection and recovery. CLI: `add-pin`/`remove-pins`/`promote-pins`/`list-pins`. | Quick session scoping to frequently-used directories without walking the tree each time | yes | Drop the local carry once PR #5 merges (stacks on #4 — the export commit rides along until #4 merges) | n/a | xichan96/dinotty-plugins#5 (merged 2026-07-20) | merged-upstream |
| 6488a2b…58f7b63 | `session-browser/src/{history-cli,ui,i18n,icons,types,codex-connector}.ts`, `styles.css`, `test/`, `dist/` | feature | Minimap turn outline + jump pill for the transcript pane. Right-edge tick rail, one tick per REAL user turn — injected pseudo-user messages (task-notification/command-name/command-message/local-command-stdout/local-command-caveat/system-reminder/bash-input/bash-stdout prefixes, plus isCompactSummary/isVisibleInTranscriptOnly/isMeta flags, plus codex-connector injected shapes) are excluded via an `isRealUser` field tagged at parse time, fail-open toward inclusion. Hover (fine pointer) or two-stage tap (touch, <8px slop) opens a head-excerpt preview card with short-screen degradation ladder (3-line → 1-line → focus-only, measured heights); click/second-tap jumps. Rail is a Pointer Events scrubber (drag to preview, release to jump) with a 12px edge inset and nearest-tick hit mapping. Bottom/top jump pill with large hysteresis (enter ≤24px, exit > max(200px, half-viewport)) and arrow-to-line glyphs. Keyboard-summon defenses (no focusable inputs, pointerdown preventDefault on touch/pen, scoped #mobile-kb observer, kb-avoid rail shortening). ARIA listbox + full keyboard protocol. en+zh i18n. 241 tests. | Fast navigation to any user turn in long transcripts without scroll-hunting; mobile-safe (no keyboard summon, no kb-icon occlusion) | yes | Drop the local carry once PR #7 merges | n/a | xichan96/dinotty-plugins#7 (filed 2026-07-23, branch feat/session-browser-minimap, squashed dd288da) | filed |
| 03459e6…187262b | `plugin-api/index.d.ts`, `session-browser/src/ui.ts`, `session-browser/{package.json,tsconfig.json}`, `session-browser/test/{ui-multi-mount,ui-scroll-restore,ui-mutations,ui-tree,pins-ui,i18n}.test.js`, `session-browser/docs/seam-ranges.txt`, `dist/` | fix | Per-pane plugin runtime, plus transcript scroll restore across a tab switch. (a) `activate()` runs once per plugin id while the host mounts the component once per pane, so the whole ~4000-line UI closure was shared and a single `activeMount` was seized on every mount with no path returning it — opening the Session Browser in a second workspace left the first pane permanently inert, since ~50 interaction sites are gated on `isActiveMount`. The closure became a `createPaneRuntime(ctx, props, shared)` factory; `activate()` now holds only genuinely shared services (session index, agent selection, four appearance preferences, the destructive-mutation coordinator, the hot-reload handoff carrier). Each pane keeps its own selection, transcript, search, tree and scroll state. (b) Hiding a pane is pure CSS, so its width goes to 0, the narrow-screen layout engages, and on return the reflow changes transcript height while `scrollTop` still holds the old pixel value; each mount now records a stick-to-bottom flag plus a stable `message.uuid` anchor and restores after the render settles, with jump-class scrolls (minimap tick, jump pill, open-transcript) capturing their destination and restore-class scrolls excluded. Also vendors `plugin-api/index.d.ts` and adds a `typecheck` script so the UI bundle is compiler-checked. Depends on the host's new pane-identity/visibility props (dinotty `4b0828d8`); without them (b) degrades to the width-transition trigger and (a) is unaffected. 256 tests. | Two workspaces cannot both use the Session Browser at all, and returning to a transcript loses the reading position | yes | Drop the local carry once PR #8 merges | n/a | xichan96/dinotty-plugins#8 (filed 2026-07-28, branch upstream-pr/session-browser-per-pane, 2 commits: chore typecheck + squashed fix) | pr-open |
| d630ae8 | `.claude/settings.local.json` | hygiene | Untracks the upstream author's personal machine-local Claude settings file. The file itself is left on disk; only the tracking is removed, and this deletion is deliberately excluded from every upstream PR. | A personal editor settings file tracked in a shared repo leaks one contributor's local config to everyone | maybe | Drop if upstream untracks it themselves | candidate | n/a | private |

> PR #8 extraction note (`2026-07-28`): the PR branch was cut fresh from `upstream/main` and carries
> the six local commits as two — a `chore` (vendored plugin-api declarations + tsconfig + typecheck
> script) and a squashed `fix`. `session-browser/docs/seam-ranges.txt` is deliberately EXCLUDED from
> the PR: it is our internal L3 scope fence, written against our own task decomposition and baseline
> SHA, and is meaningless upstream. It stays on `custom`. Verified before push: the PR tree is
> byte-identical to the tested `0693fc2` across `src/`, `test/`, `dist/`, `plugin-api/` and the
> package files; `npm test` 256/256 and `npm run typecheck` clean on the upstream base; `npm run
> build` reproduces the committed `dist/main.js` exactly.

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
| Read-only session browser plugin (browse/search/resume/rename/archive-restore, i18n zh/en) | merged-upstream | `8ea935c` lineage, merged as PR #1 (`939928c`). Originally added at `cc-session-browser/`. |
| Resume-session control uses a terminal icon | merged-upstream | `10baa41` lineage, merged as PR #2 (`a1782ed`). |
| Multi-agent support (connector registry + Codex connector) and the `cc-session-browser` → `session-browser` rename | merged-upstream | `3f196c6`/`99ef7ad` lineage, merged as PR #3 (`b44464e`). The rename landed upstream, so the fork no longer carries a divergent `registry.json`; the rebuilt `custom` takes upstream's copy verbatim. Intentional residuals upstream accepted: internal `ccm-` CSS prefix and `CC_SB_*` environment variable names. |

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

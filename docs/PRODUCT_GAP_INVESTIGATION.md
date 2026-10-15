# Naz Autoreply product and comment automation audit

Audit date: 2026-10-15  
Scope: the two local repositories and the attached product-engineering specification. Production was not accessed or changed.

## Repository baseline

| Repository | Branch / upstream | Initial HEAD | Working tree | Baseline checks |
|---|---|---|---|---|
| Backend | `main` / `origin/main` | `ac1562f0c10421f6ff1ee65a887fce0886b216e8` | Clean; matches origin | `php artisan test`: 583 passed, 27 failed, 2 skipped (213.32s); PHPUnit deprecation warnings. Comment automation feature tests passed. |
| Frontend | `main` / `origin/main` | `88d5bbd9bca248f4360306032dd5744b40af0f3a` | Clean; matches origin | `npm run test`: 1 file / 2 tests passed. `npm run build`: passed. `npm run lint`: failed on existing repository-wide ESLint errors and warnings. |

Both reported starting commits are ancestors of their current `HEAD`; neither repository had diverged from `origin/main`. PHP CLI is 8.3.33, Node is 20.14.0, npm is 10.7.0, Laravel is 11.x, Next.js is 16.2.7, React is 19.2.4, and Vitest is 3.2.7. Frontend instructions require reading the installed Next.js documentation before Next-related edits. No backend-specific `AGENTS.md` or `CLAUDE.md` was found. The frontend `CLAUDE.md` delegates to `AGENTS.md`.

## Current architecture and relationships

`BusinessProfile` owns bots, channels, conversations, products, and comment events. `Bot` belongs to a business and has many-to-many communication channel assignments through `bot_channels`; it also has commerce connections and knowledge assignments. `Conversation` belongs to a business, channel, bot, customer, and optional ecommerce connection, and owns messages. A `SocialCommentEvent` is directly associated with its business and channel and optionally with the resolved bot. The event table has a unique key over platform, channel, comment ID, and event type, plus a business/status/time queue index. Bot/channel comment configuration currently lives in `bot_channels.comment_settings` with separate enabled flags.

## Already implemented (verified in code and baseline tests)

- Meta webhook handling recognizes Facebook Page feed/comments and Instagram comments; normalized comment events are persisted against one uniquely resolved connected channel. Ambiguous account resolution fails closed.
- Event receipt is deduplicated by the database unique key and queued through `ProcessSocialCommentEvent`.
- The worker resolves one active bot for the channel (single candidate or one primary), validates business/account ownership, applies current trigger and exclusion arrays, creates a conversation/message record, resolves commerce context, and generates a public reply.
- `MetaCommentAutomationService` implements Facebook/Instagram public comment reply endpoints, a private-reply method with a seven-day guard and live Instagram restriction, and public-disclosure filtering. The current controller reports private replies disabled, the settings writer forces them false, and the worker only attempts public replies.
- Worker events persist coarse statuses, attempts, reply IDs, and failure codes/reason. The job uses a database-backed lock. Existing Meta tests fake outbound requests and cover webhook signatures, duplicate event receipt, account ambiguity, public endpoints, basic private eligibility, and disclosure filtering.
- Authenticated settings GET/PUT endpoints are scoped through `ActiveBusiness`, the bot, and assigned Facebook/Instagram channels. The comments API lists business-scoped events and returns basic status counts and a related reply message.
- The comment dashboard loads real API data, refreshes every 30 seconds, supports status/platform/search filters, and shows comment/reply details with loading and empty states.
- The bot wizard already contains channel/store routing and per-channel comment settings. It has a test for channel mapping.
- The shared UI exports `Checkbox`, `Radio`, `Select`, and `Switch`. `Select` is a custom single-value listbox; it has no multi-select value contract. `Modal` already exposes a footer, `aria-modal`, Escape handling, and basic scroll locking.

## Partially implemented or broken

- Comment rules are not structured named rules. Existing behavior is one `trigger_keywords` array plus `excluded_keywords`; matching is lowercased substring search, without an explicit `contains`/`equals` mode, whole-word boundary, Unicode normalization contract, stable rule ID/version, precedence, or selected-rule trace.
- Comment actions are effectively public-only. The API accepts a legacy private flag but stores it false; there is no public/DM/both action selection in the runtime. A delay, comment deletion/moderation lifecycle, scheduled cancellation, and action-level partial outcome are not represented in the event schema/worker.
- Public reply text comes from AI/fallback, rather than a configured variant selected and persisted before send. The event does not persist the selected configuration, matched keywords, requested/permitted action, per-action outcome, or an operational decision trace.
- The dashboard’s counters are total, processed, and not processed; `needs_attention` includes all non-processed records, including terminal skips. There are no rule-specific metrics, skip reason filters, lifecycle details, test simulator, saved regression scenarios, or suite runner.
- The dashboard displays raw `failure_reason` alongside the code. Current worker stores a PHP exception class/file/line, not the exception message, but the API should still expose an explicitly safe diagnostic mapping instead of passing a raw field through.
- Native checkbox/radio/select controls remain in the requested pages, BotWizard, and other application files. The wizard uses native multi-select for knowledge scope because the shared `Select` only supports a scalar value. The current custom Select needs an accessible multi-select design before replacing that control.
- Landing `Navbar` maintains a local label map instead of reading `t.nav`; it installs and cleans its scroll listener once, but mobile Escape handling, body scroll locking, route-aware closure, focus behavior, explicit aria labels, and consistent Link use are absent. Modal lacks an accessible name guarantee, focus entry/trap/restoration, exit animation, and safe preservation of pre-existing body overflow state.
- The baseline frontend lint currently fails repository-wide, so full lint cleanliness is not available as a baseline. There are no baseline tests for custom controls, navbar behavior, or modal focus management.

## Confirmed absent

- Backend dry-run/simulator endpoint that evaluates rules without outbound integrations.
- Persistent, tenant-scoped regression scenario storage and test-suite execution.
- Shared pure rule evaluation used by both production processing and a simulator.
- Detailed decision trace for event receipt, dedupe, match, eligibility, scheduling, action send, and final status.
- Rule-management CRUD UI and rule-level activity.
- Automation Trust Center health and failure view.
- Existing `docs/ROADMAP.md` in either repository.

## Product evidence and opportunity

Respond.io's public request for automated AI-agent testing describes manual one-case-at-a-time testing and regression risk; its page was marked under review and showed 18 votes when checked. Its request for AI-agent failure alerts describes teams learning of errors from customer complaints or manual inspection; it showed 2 votes. Those are direct user reports on a vendor roadmap, not proof of market-wide demand. Respond.io's active board also contains current requests about message reactions, historical context, knowledge-source prioritization, and notifications.

The supplied Reddit thread contains a small-brand operator saying multi-account ManyChat cost adds up and asking for a free/open-source comment-to-DM option. Replies are sparse and partly removed; this is weak qualitative evidence, not a market-size estimate. The second supplied Reddit page was reachable but its content was not reliably extracted by the browser tool, so it is not treated as evidence.

Manychat's current documentation describes post/reel comment triggers and has a separate troubleshooting article, indicating this is an established automation category with platform-dependent setup and failure modes. Intercom publicly describes Evals and Releases for testing AI behavior before and after release, so regression evaluation is not unique. Gorgias documents automation compatibility by ecommerce provider, illustrating that provider capabilities differ and should be visible rather than implied to be uniform.

The Trust Center is a reasonable opportunity because it combines test-before-send, event-level operational outcomes, and account-aware diagnostics directly with Naz's existing comment-event records and account connections. The potentially differentiating implementation is the vertical integration with connected Meta accounts, bot/channel assignment, and resolved commerce context for small merchants. That is a hypothesis to validate with Naz customers, not a claim of feature uniqueness.

## Proposed architecture before implementation

Keep `SocialCommentEvent` as the durable lifecycle record. Extract a deterministic, side-effect-free evaluator from the queue job. It will resolve one active bot and one assigned channel using persisted IDs, validate tenant/account scope, normalize text deterministically, evaluate rules in an explicit order, and return a typed decision containing rule identity, matched/excluded keywords, requested action, eligibility, safe reason code, delay, and preview content. The production job and a business-scoped simulator endpoint will call that same evaluator. Only the production job can call the send service.

Extend existing bot/channel `comment_settings` compatibly, with a versioned structured-rule representation and a one-time legacy conversion that preserves existing triggers. Persist event decision/action metadata and safe outcomes on the existing event model/table rather than introducing a separate execution engine. Add tenant-scoped synthetic scenario records only if schema inspection confirms no existing suitable table. Reuse existing notification records for deduplicated actionable failures if a safe owner-recipient path is established; otherwise show failure health in the event UI and document the alert gap.

Keep rule editing and simulation in the existing Comments workspace and settings API. Reuse design-system components, first adding a backward-compatible multi-select contract only if its keyboard and accessible behavior can be tested. Preserve the current bot wizard form/persistence. Upgrade shared Modal and landing Navbar without changing unrelated authentication, commerce, billing, AI provider, or channel connection behavior.

## Constraints and unresolved policy points

- The worker currently implements public replies only. Enabling private replies requires verifying the specific current official Meta API policy and permissions; third-party pages report one private reply within seven days, but an official Meta source was not retrievable in this audit. The implementation must not widen private sending based only on third-party claims.
- No live posts, comments, messages, or orders may be created for verification. All outbound test traffic must be faked.
- Production, server files, server configuration, queues, and migrations remain untouched. No push or deployment is included.
- Initial baseline failures are not yet attributed individually in this report. They remain baseline failures until each is reproduced/diagnosed; they must not be described as caused by or fixed by this work without evidence.

## Implementation completed in this local worktree

### Backend

- Added `SocialCommentRuleEvaluator`, a deterministic evaluator used by the real comment job and the dry-run/suite endpoints. It supports structured rules and preserves legacy keyword settings, whole-word contains matching, exact matching, exclusions, post targeting, enabled state, action eligibility, and trace fields.
- Added tenant-scoped simulator and saved regression scenario endpoints. Simulator/suite code has no outbound messaging path, checks bot/channel ownership and assignment, and reports disconnected-account and unresolved/resolved commerce context diagnostics.
- Added structured rule validation and a scenario table migration. The job now selects a public reply variant deterministically, records decision/action/final outcome data, schedules delayed replies, checks account/context again at execution, and avoids retrying terminal or cancelled events.
- A Meta `comment_remove` event cancels an uncompleted matching comment event. Event API output uses safe failure classifications rather than raw provider response data.
- New backend tests cover the evaluator, simulator safety/tenant isolation, scenario reruns, structured settings validation, delayed scheduling, and deletion cancellation.

### Frontend

- Replaced native checkbox/radio/select controls in the requested application scope with the existing shared components. The repository scan leaves native checkbox/radio elements only inside `components/ui/Checkbox.tsx` and `components/ui/Radio.tsx`; the Bot wizard retains multi-value knowledge assignment using checkboxes rather than converting it to a scalar select.
- Updated the landing navbar to use localization keys and close/restore the mobile navigation on route changes, Escape, and unmount. The shared Modal now manages dialog naming, focus trap/restoration, Escape, scroll lock, and exit animation; the Bot wizard's existing custom dialog remains specialized rather than being replaced.
- Extended the Comments workspace with structured rule editing, the dry-run simulator, saved scenario CRUD/suite execution, diagnostics, and event decision traces using the actual backend APIs. No production-facing sample counters were introduced.
- Added custom control, modal, Bot wizard routing, and Trust Center tests. Added `docs/ROADMAP.md` with evidence, priority, complexity, dependencies, and validation notes.

### Explicitly incomplete or restricted

- The prior product instruction from the owner is to send comment responses publicly only. This conflicts with the supplied request for configurable private replies/DM. Private sending remains disabled server-side; the UI cannot enable it. This preserves the previous product decision and avoids widening Meta behavior without policy/permission verification.
- The simulator currently evaluates deterministic rule decisions and configured reply variants/fallbacks; it intentionally does not call the AI model to preview generated text. Its form does not model every webhook eligibility field (for example, a deleted event or already-sent private reply). Those need additional safe domain fixtures if private/comment moderation actions are later enabled.
- Failure visibility is available through persisted event outcomes and safe trace fields, but this work did not add deduplicated in-app failure notifications, a queue-backlog monitor, per-rule analytics, or automatic Meta permission verification.
- The rule editor and diagnostics are present, but full browser review of the landing page in both languages, mobile navigation, and every Comments loading/error/permission state was not completed in this run. Treat those states as requiring manual UI review.

### Final verification for this work

- Backend baseline: 583 passed, 27 failed, 2 skipped. Final full run: 598 passed, 25 failed, 2 skipped (2,531 assertions). Focused comment automation run: 21 passed (83 assertions). The full-suite failure identities were not all compared against baseline, so no individual failure is claimed as pre-existing or fixed based on counts alone.
- Frontend baseline: 1 test file / 2 tests passed. Final Vitest run: 5 files / 9 tests passed. The production build completed successfully, including TypeScript checks and generation of all 60 static page data entries.
- Baseline frontend lint failed repository-wide (592 reported problems). The final full lint run also failed: 346 errors and 246 warnings (592 problems). Two warnings in the newly added tests were corrected afterward; targeted lint for the navbar test, navbar component, and modal component had 0 errors and 2 image-mock warnings before that cleanup. A complete lint rerun after those last test-only cleanups was not performed.
- Production/server was not accessed, no deploy or push occurred, and no live Meta message/comment or commerce order was created.

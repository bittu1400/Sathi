# Contributing

## Flow
1. `git switch main && git pull`
2. `git switch -c {a|b|c}/{TASK-ID}-{slug}`, e.g. `b/B-05-ams-engine`
3. Build the task. Stay inside your owned folders (see [CLAUDE.md](CLAUDE.md#layout--ownership)).
4. `pnpm check` must pass.
5. `git fetch && git rebase origin/main`, push, and open a PR titled `TASK-ID: Title`. Fill in the template.
6. Post the PR link in team chat. One approval from another teammate + green CI → **squash merge** (by the author).

## Rules
- One task per PR, ideally under ~400 changed lines. Open it as a draft early.
- Merge at least every 2 hours. No long-lived branches.
- Conventional Commits: `feat(scope): …`, `fix(scope): …`, `chore: …`, `docs: …`, `test: …`.
- No new dependencies without team agreement.
- No secrets, ever. This repo is public.
- Safety/medical wording is copied from the team's SAFETY spec, never written ad hoc.

## Reviewing (target: under 20 min)
- Ownership respected? No secrets? No new deps? No invented safety text or data?
- Open the Vercel preview and click through the acceptance criteria, including offline where relevant.
- Approve, or leave at most 3 must-fix comments. Prefix nits with `nit:`, and they don't block.

## Bugs
Open an issue with the `bug` label, the owner label (`owner:A|B|C`), and the priority (`P0|P1|P2`). Add `demo-critical` if it breaks the demo script.

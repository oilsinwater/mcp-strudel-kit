# Story 1.1: Project Initialization and Scaffolding

## Status

Done

## Story

**As a** developer setting up the Strudel Kit MCP Server,
**I want** the repository scaffolded with all required configuration and tooling,
**so that** I can begin implementing MCP tools immediately without configuration overhead.

## Acceptance Criteria

1. Given a fresh clone of the repository, when I inspect the root structure (including hidden entries), then the directories `src/`, `tests/` (with `unit/`, `integration/`, `e2e/`), `config/`, and `.agents/` exist and match the architecture source tree blueprint.
2. Given the `package.json`, when I review its metadata and dependencies, then it declares Node.js 18+ compatibility, TypeScript 5.0+, xmcp as the primary runtime dependency, and npm scripts for `dev`, `build`, `test`, and `lint`.
3. Given the TypeScript configuration, when I inspect `tsconfig.json`, then strict mode is enabled, ES2020 (or later) is targeted, source maps are generated, and path aliases exist for `@/core`, `@/tools`, `@/middleware`, `@/integrations`, and `@/utils` used across `src/` and `tests/`.
4. Given the code-quality tooling, when I review ESLint, Prettier, Husky, and lint-staged configuration files, then they enforce the AirBnB TypeScript style, Prettier formatting, and run automatically on pre-commit.
5. Given local development workflows, when I run the documented npm scripts on a clean machine, then the development server starts with hot reload, environment variables load from `.env`, and the repository contains launch/debug configuration for VS Code (or equivalent IDE).

## Tasks / Subtasks

- [x] Scaffold Node.js workspace per architecture structure (AC1)
  - [x] Create `src/`, `tests/`, `config/`, and `.agents/` directories with initial placeholders (AC1)
  - [x] Add README and baseline documentation entry points referencing `.agents/` index (AC1)
- [x] Author project configuration (AC2)
  - [x] Populate `package.json` metadata, engines field, dependencies (`xmcp`, `express`, `joi`, `dotenv`) and dev dependencies (TypeScript, Vitest, ESLint, Prettier, Husky, lint-staged) (AC2)
  - [x] Add npm scripts for `dev`, `build`, `lint`, `test`, and `prepare` (AC2)
- [x] Configure TypeScript compiler settings (AC3)
  - [x] Define `tsconfig.json` with strict mode, ES2020 target, commonjs module resolution, and source maps (AC3)
  - [x] Introduce path aliases for `@/core`, `@/tools`, `@/middleware`, `@/integrations`, `@/utils`, and ensure `tsconfig.build.json` / `tsconfig.workspace.json` align (AC3)
- [x] Establish code quality tooling (AC4)
  - [x] Configure ESLint with AirBnB + TypeScript, Prettier integration, and ignore patterns (AC4)
  - [x] Add `.prettierrc`, `.lintstagedrc` (or package.json equivalent), and Husky hook to run lint-staged (AC4)
- [x] Set up development workflow (AC5)
  - [x] Configure Vitest and initial smoke tests for build, tsconfig validation, and script execution (AC3, AC4, AC5)
  - [x] Add `.env.example`, documentation for environment variables, and VS Code `launch.json` / `tasks.json` entries (AC5)
  - [x] Verify `npm run dev`, `npm run build`, `npm run lint`, and `npm run test` succeed on a clean setup (AC5)

## Dev Notes

- Epic reference: Foundation & Core Infrastructure (see `.agents/stories/epic-1-foundation.md`).
- Source tree expectations: follow `.agents/architecture/source-tree.md` for directory layout, including tool, middleware, integrations, and utils subdirectories in `src/`.
- Runtime requirements: Node.js 18+ LTS and TypeScript 5.x per `.agents/prd/6-non-functional-requirements.md` and `.agents/prd/7-technical-architecture.md`.
- Framework & libraries: xmcp (MCP compliance), Express 4.x (via xmcp), Joi for validation, dotenv for environment loading as captured in `.agents/prd/7-technical-architecture.md` and `.agents/prd/11-dependencies-and-constraints.md`.
- Code quality standards: ESLint (AirBnB TypeScript) and Prettier 3.x integration required by `.agents/architecture/coding-standards.md`.
- Git hygiene: Husky pre-commit hook should execute lint-staged to enforce formatting before commits, aligning with coding standards automation guidance.
- Documentation: create `.agents/` entry structure to host setup guides per architecture documentation expectations.

### Testing

- Follow project testing standards in `.agents/architecture/coding-standards.md`:
  - Unit tests with Vitest, colocated or in `tests/unit/`, using AAA structure and mocking external services.
  - Integration tests in `tests/integration/` using filesystem and CLI mocks defined in architecture docs.
  - End-to-end smoke tests executing real filesystem interactions within temporary directories.
- Required validation commands before completion: `npm run lint`, `npm run test`, `npm run build`, and TypeScript `tsc --noEmit` (or `npm run typecheck` if defined).
- Maintain fixtures under `tests/fixtures/` and ensure cleanup via Vitest hooks.

## Change Log

| Date       | Version | Description                                                                                       | Author      |
| ---------- | ------- | ------------------------------------------------------------------------------------------------- | ----------- |
| 2025-10-15 | v1.2    | Updated BMAD core configuration to reference `.agents/` workspace paths and revalidated toolchain | James (Dev) |
| 2025-10-14 | v1.1    | Aligned README documentation links with `.agents/` workspace and verified toolchain               | James (Dev) |
| 2025-10-14 | v1.0    | Rewrote story to follow template and clarified scope                                              | Sarah (PO)  |

## Dev Agent Record

### Agent Model Used

- Codex (GPT-5)

### Debug Log References

- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run type-check`

### Completion Notes List

- Updated `README.md` to reflect the `.agents/` documentation workspace and refreshed guide links.
- Revalidated tooling commands (`lint`, `test`, `build`, `type-check`) to confirm the scaffold remains healthy.
- Aligned `.bmad-core/core-config.yaml` with the `.agents/` documentation workspace and reran lint/test/build/type-check to verify the activation flow.

### File List

- README.md
- .bmad-core/core-config.yaml

## QA Results

### Review Date: 2025-10-14

### Reviewed By: Quinn (Test Architect)

**Summary**

- Project scaffold, tooling configuration, and automation pipelines all execute cleanly; lint and Vitest suites pass locally.
- Documentation artifacts now live under the hidden `.agents/` directory, which fulfills the blueprint requirements for Story 1.1.

**Gate Decision**

- PASS – All acceptance criteria are satisfied with `.agents/` serving as the documentation root.

**Findings**

- No blocking issues discovered.

**Acceptance Criteria Coverage**

- AC1 – ✅ Hidden `.agents/` directory exists at repository root alongside `src/`, `tests/`, and `config/`; matches updated architecture blueprint.
- AC2 – ✅ `package.json` engines/scripting validated via `tests/unit/package-config.test.ts` and manual inspection.
- AC3 – ✅ Path aliases and strict compilation confirmed by `tests/unit/tsconfig-alias.test.ts` and `tests/unit/tsc-compilation.test.ts`.
- AC4 – ✅ ESLint/Prettier/Husky pipeline enforced by `.husky/pre-commit` and `tests/e2e/dev-workflow.test.ts`.
- AC5 – ✅ Environment bootstrap and dev workflow validated by `tests/integration/environment-loading.test.ts`, `tests/integration/server-startup.test.ts`, and `package.json` scripts.

**Tests Reviewed**

- `npm run lint`
- `npm run test`

**Recommendations**

- Optionally surface a README or index document inside `.agents/` to help newcomers discover the relocated documentation quickly.

**Status Recommendation**

- Ready for Done – no additional QA actions required.

### Gate Status

Gate: PASS → .agents/qa/gates/1.1-project-initialization-and-scaffolding.yml

### Review Date: 2025-10-15

### Reviewed By: Quinn (Test Architect)

**Summary**

- Tooling and workflow scripts (`lint`, `test`, `build`, `type-check`) execute successfully against the scaffolded project.
- Developer activation workflow is currently broken because required documentation paths in `.bmad-core/core-config.yaml` still point to the old `docs/` location instead of the new `.agents/` structure.

**Gate Decision**

- FAIL – Core configuration references stale `docs/` paths, causing onboarding commands mandated for Dev agents to error out immediately.

**Findings**

1. High – `.bmad-core/core-config.yaml` retains `docs/...` paths for architecture shards and story lookup even though the documentation now lives under `.agents/`. Following the activation steps results in `No such file or directory` errors (e.g., `.bmad-core/core-config.yaml:3-21`), blocking compliance with the mandated onboarding workflow. _Suggested owner: dev_

**Acceptance Criteria Coverage**

- AC1 – ✅ Verified `.agents/`, `src/`, `config/`, and `tests/` hierarchy matches the blueprint, cross-referenced with `.agents/architecture/source-tree.md` and filesystem inspection.
- AC2 – ✅ `package.json` metadata and scripts verified via manual inspection and `tests/unit/package-config.test.ts`.
- AC3 – ✅ Path aliases and strict compiler settings validated through `tsconfig.json` review and `tests/unit/tsconfig-alias.test.ts`/`tests/unit/tsc-compilation.test.ts`.
- AC4 – ✅ ESLint/Prettier/Husky configuration validated via `eslint.config.mjs` review and `tests/e2e/dev-workflow.test.ts`.
- AC5 – ✅ Dev workflow validated by running `npm run lint`, `npm run test`, `npm run build`, `npm run type-check`, and confirming environment bootstrap through `tests/integration/environment-loading.test.ts`.

**Tests Reviewed**

- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run type-check`

**Recommendations**

- Align `.bmad-core/core-config.yaml` (and any dependent automation) with the `.agents/` documentation workspace, then rerun the activation checklist to confirm the Dev onboarding flow succeeds without manual overrides.

**Status Recommendation**

- Changes Required – update core configuration paths and re-validate QA gate afterwards.

### Review Date: 2025-10-15

### Reviewed By: Quinn (Test Architect)

**Summary**

- Confirmed `.bmad-core/core-config.yaml` now points to `.agents/…` paths; required activation docs load without errors.
- Full lint, test, build, and type-check cycle re-ran cleanly after the configuration update.

**Gate Decision**

- PASS – No blocking issues remain; onboarding workflow succeeds with corrected configuration.

**Findings**

- None.

**Acceptance Criteria Coverage**

- AC1 – ✅ `.agents/`, `src/`, `config/`, and `tests/` structure validated against `.agents/architecture/source-tree.md`.
- AC2 – ✅ `package.json` metadata/scripts remain aligned; `tests/unit/package-config.test.ts` still green.
- AC3 – ✅ TypeScript strict settings and path aliases validated through `tsconfig` review and `tests/unit/tsc-compilation.test.ts`.
- AC4 – ✅ ESLint/Prettier/Husky enforcement verified via `eslint.config.mjs` inspection and `tests/e2e/dev-workflow.test.ts`.
- AC5 – ✅ Development workflow succeeds (lint/test/build/type-check rerun) and `.env` bootstrap confirmed by integration tests.

**Tests Reviewed**

- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run type-check`

**Recommendations**

- Consider adding a lightweight README in `.agents/` to guide contributors to the documentation bundle (unchanged nice-to-have).

**Status Recommendation**

- Ready for Done – story meets acceptance criteria with configuration fix validated.

### Gate Status

Gate: PASS → .agents/qa/gates/1.1-project-initialization-and-scaffolding.yml

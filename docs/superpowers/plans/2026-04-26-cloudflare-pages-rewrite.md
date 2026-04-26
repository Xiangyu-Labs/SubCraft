# SubCraft Cloudflare Pages Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Next.js 16 framework with a Vite + React 19 SPA served by Cloudflare Pages, with the single API endpoint reimplemented as a Pages Function. All existing user-facing behavior is preserved.

**Architecture:**
- Frontend: Vite-built React 19 SPA → static `dist/`, served by Cloudflare Pages CDN.
- Backend: One Pages Function at `functions/api/sub.ts` (no Hono/framework — only one route).
- Shared logic: `src/shared/*` (encoder, parsers, generators, rules, types) imported by both the SPA and the Pages Function.
- Deployment: Wrangler-driven CF Pages auto-deploy from GitHub `main` (replaces Docker / GHCR / Traefik / Watchtower stack).

**Tech Stack:** Vite 5, React 19, TypeScript 5, Tailwind v4, Wrangler 3, Vitest 4, `pako`, `js-yaml`, `lucide-react`.

---

## Pre-flight Notes

- Run inside a worktree or feature branch — this rewrite touches the project root config and replaces large parts of `src/`.
- All commands assume CWD = repo root.
- Node ≥ 20 required (matches existing CI).
- The migration runs in-place: old Next.js files are replaced phase-by-phase, with a final cleanup task that deletes leftover Next.js artifacts.
- `npm install` is run multiple times across tasks. Each occurrence is intentional (re-resolve deps after `package.json` edits or after new files require new packages).
- `lucide-react` is pinned at the existing version (`^1.8.0`) to match `package.json`. Do not bump.

---

## File Plan (decomposition)

### Files to CREATE
- `vite.config.ts` — Vite + React plugin + `/api` dev proxy + `@/*` alias.
- `wrangler.toml` — Pages config (`pages_build_output_dir = "./dist"`).
- `index.html` — SPA entry HTML at repo root (Vite convention).
- `src/main.tsx` — React entry, mounts `<App />`.
- `src/App.tsx` — Root component (the page).
- `src/components/SubscriptionForm.tsx` — Form (rewrite of `src/components/subscription-form.tsx`, drop `'use client'`, change imports).
- `src/components/ThemeSwitcher.tsx` — Theme switcher (rewrite of `src/components/theme-switcher.tsx`).
- `src/styles/globals.css` — Move of `src/app/globals.css`.
- `src/shared/types.ts` — Move of `src/lib/types.ts`.
- `src/shared/encoder.ts` — Move of `src/lib/encoder.ts`.
- `src/shared/rules.ts` — Move of `src/lib/rules.ts`.
- `src/shared/parsers/index.ts` — Move of `src/lib/parsers/index.ts`.
- `src/shared/parsers/vless.ts` — Move of `src/lib/parsers/vless.ts`.
- `src/shared/generators/clash.ts` — Move of `src/lib/generators/clash.ts`.
- `functions/api/sub.ts` — Pages Function for `GET /api/sub?data=…`.
- `tests/shared/encoder.test.ts` — Move of `tests/lib/encoder.test.ts`.
- `tests/shared/parsers/vless.test.ts` — Move of `tests/lib/parsers/vless.test.ts`.
- `tests/shared/generators/clash.test.ts` — Move of `tests/lib/generators/clash.test.ts`.
- `tests/functions/api/sub.test.ts` — New unit test for the Pages Function handler.
- `.github/workflows/deploy.yml` — Replaced workflow (lint + tsc + tests, then deploy via `wrangler pages deploy`).

### Files to MODIFY
- `package.json` — Drop Next.js deps, add Vite/Wrangler/Hono-ecosystem deps, change scripts.
- `tsconfig.json` — Replace Next.js plugin/types with Vite + Workers types.
- `vitest.config.ts` — Update alias for new `src/shared` path.
- `eslint.config.mjs` — Drop `eslint-config-next`, use `@eslint/js` + `eslint-plugin-react-hooks`.
- `.env.example`, `.env.local`, `.env` — Replace `NEXT_PUBLIC_APP_URL` with `VITE_APP_URL`.
- `README.md` — Rewrite "Quick Start", "Docker Deployment", and "CI/CD" sections.
- `.gitignore` — Add `.wrangler/`, `dist/`; drop `.next/`.

### Files to DELETE (final cleanup task)
- `src/app/` — Entire Next.js App Router directory (page, layout, error, not-found, ui/, api/sub/).
- `src/components/subscription-form.tsx` — Replaced by `src/components/SubscriptionForm.tsx`.
- `src/components/theme-switcher.tsx` — Replaced by `src/components/ThemeSwitcher.tsx`.
- `src/components/ui/` — Unused shadcn primitives (none referenced by the form).
- `src/lib/encoder.ts`, `src/lib/types.ts`, `src/lib/rules.ts`, `src/lib/parsers/`, `src/lib/generators/` — Moved into `src/shared/`.
- `next.config.ts`, `next-env.d.ts`.
- `Dockerfile`, `docker-compose.yml`, `docker-compose.override.yml`, `docker-entrypoint.sh`, `.dockerignore`.
- `components.json` — shadcn CLI config (no longer needed).
- `postcss.config.mjs` — Replaced by `@tailwindcss/vite` plugin in `vite.config.ts`.
- `tests/lib/` — Moved to `tests/shared/`.
- `tsconfig.tsbuildinfo` — Stale Next.js build cache.

### Files to PRESERVE unchanged
- `src/lib/utils.ts` (the `cn` helper — kept for future use, still imports `clsx`/`tailwind-merge`).
- `src/lib/theme.ts` (frontend theme storage — kept under `src/lib/`).
- `LICENSE`, `.github/` (other than the deploy workflow).

---

## Tasks

### Task 1: Create feature branch

**Files:**
- None.

- [ ] **Step 1: Branch off main**

```bash
git checkout main
git pull --ff-only
git checkout -b cloudflare-pages-rewrite
```

- [ ] **Step 2: Confirm clean state**

Run: `git status`
Expected: `nothing to commit, working tree clean`.

---

### Task 2: Replace `package.json` dependencies and scripts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Overwrite `package.json`**

```json
{
  "name": "subcraft",
  "version": "0.2.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "dev:functions": "wrangler pages dev dist --port 8788 --live-reload",
    "build": "vite build",
    "preview": "wrangler pages dev dist --port 3000",
    "deploy": "wrangler pages deploy dist",
    "lint": "eslint src functions",
    "tsc": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui"
  },
  "dependencies": {
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "js-yaml": "^4.1.1",
    "lucide-react": "^1.8.0",
    "pako": "^2.1.0",
    "react": "^19.2.5",
    "react-dom": "^19.2.5",
    "tailwind-merge": "^3.4.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20240909.0",
    "@eslint/js": "^9.13.0",
    "@tailwindcss/vite": "^4",
    "@types/js-yaml": "^4.0.9",
    "@types/node": "^20",
    "@types/pako": "^2.0.4",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@vitejs/plugin-react": "^4.3.4",
    "@vitest/ui": "^4.1.4",
    "eslint": "^9",
    "eslint-plugin-react-hooks": "^5.0.0",
    "eslint-plugin-react-refresh": "^0.4.14",
    "globals": "^15.11.0",
    "tailwindcss": "^4",
    "tw-animate-css": "^1.4.0",
    "typescript": "^5",
    "typescript-eslint": "^8.12.0",
    "vite": "^5.4.10",
    "vitest": "^4.1.4",
    "wrangler": "^3.80.0"
  }
}
```

- [ ] **Step 2: Reinstall dependencies**

Run: `npm install`
Expected: `added N packages, removed M packages, audited K packages` with no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: swap dependencies from Next.js to Vite + Wrangler"
```

---

### Task 3: Add `vite.config.ts`

**Files:**
- Create: `vite.config.ts`

- [ ] **Step 1: Write `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8788',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add vite.config.ts
git commit -m "build: add vite config with /api proxy and @ alias"
```

---

### Task 4: Add `wrangler.toml`

**Files:**
- Create: `wrangler.toml`

- [ ] **Step 1: Write `wrangler.toml`**

```toml
name = "subcraft"
compatibility_date = "2024-09-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = "./dist"
```

> `nodejs_compat` is required because `js-yaml` uses Buffer in some code paths.

- [ ] **Step 2: Commit**

```bash
git add wrangler.toml
git commit -m "build: add wrangler config for Pages deployment"
```

---

### Task 5: Replace `tsconfig.json` with Vite + Workers config

**Files:**
- Modify: `tsconfig.json`

- [ ] **Step 1: Overwrite `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "noEmit": true,
    "allowSyntheticDefaultImports": true,
    "types": ["@cloudflare/workers-types", "node", "vite/client"],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "functions/**/*.ts",
    "tests/**/*.ts",
    "vite.config.ts",
    "vitest.config.ts"
  ],
  "exclude": ["node_modules", "dist", ".wrangler"]
}
```

- [ ] **Step 2: Run typecheck (expect failures because old Next.js files still exist)**

Run: `npx tsc --noEmit`
Expected: errors from `src/app/` files referencing `next/*`. Note them but do not fix yet — they will disappear after Task 27 deletes the Next.js code.

- [ ] **Step 3: Commit**

```bash
git add tsconfig.json
git commit -m "build: replace Next.js tsconfig with Vite + Workers config"
```

---

### Task 6: Update `vitest.config.ts` for new shared path

**Files:**
- Modify: `vitest.config.ts`

- [ ] **Step 1: Overwrite `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add vitest.config.ts
git commit -m "build: scope vitest to tests/ and keep @ alias"
```

---

### Task 7: Move types to `src/shared/types.ts`

**Files:**
- Create: `src/shared/types.ts`

- [ ] **Step 1: Copy contents of `src/lib/types.ts` verbatim into `src/shared/types.ts`**

The file has no imports, so no path changes are needed. Use the existing 105 lines as-is.

- [ ] **Step 2: Verify file**

Run: `wc -l src/shared/types.ts`
Expected: `105 src/shared/types.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/shared/types.ts
git commit -m "refactor: move types to src/shared/types.ts"
```

---

### Task 8: Move encoder + run existing tests

**Files:**
- Create: `src/shared/encoder.ts`
- Create: `tests/shared/encoder.test.ts`

- [ ] **Step 1: Copy `src/lib/encoder.ts` to `src/shared/encoder.ts`**

The only import is `import type { SubscriptionData } from './types';`. After moving, this still resolves correctly because both files now sit in `src/shared/`.

- [ ] **Step 2: Copy `tests/lib/encoder.test.ts` to `tests/shared/encoder.test.ts` with updated imports**

```ts
import { describe, it, expect } from 'vitest';
import { encodeSubscriptionData, decodeSubscriptionData } from '@/shared/encoder';
import type { SubscriptionData } from '@/shared/types';

describe('encoder', () => {
  const testData: SubscriptionData = {
    links: ['vless://test@example.com:443?encryption=none#TestNode'],
    template: 'balanced',
    client: 'clash',
  };

  it('should encode and decode data correctly', () => {
    const encoded = encodeSubscriptionData(testData);
    expect(encoded).toBeTruthy();
    expect(typeof encoded).toBe('string');

    const decoded = decodeSubscriptionData(encoded);
    expect(decoded).toEqual(testData);
  });

  it('should handle multiple links', () => {
    const data: SubscriptionData = {
      links: ['vless://1@host1:443#Node1', 'vless://2@host2:443#Node2'],
      template: 'minimal',
      client: 'clash',
    };
    const encoded = encodeSubscriptionData(data);
    const decoded = decodeSubscriptionData(encoded);
    expect(decoded.links).toHaveLength(2);
  });

  it('should throw error for invalid encoded data', () => {
    expect(() => decodeSubscriptionData('invalid')).toThrow();
  });
});
```

- [ ] **Step 3: Run the new test file**

Run: `npx vitest run tests/shared/encoder.test.ts`
Expected: 3 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/shared/encoder.ts tests/shared/encoder.test.ts
git commit -m "refactor: move encoder + tests to src/shared"
```

---

### Task 9: Move vless parser + run existing tests

**Files:**
- Create: `src/shared/parsers/vless.ts`
- Create: `tests/shared/parsers/vless.test.ts`

- [ ] **Step 1: Copy `src/lib/parsers/vless.ts` to `src/shared/parsers/vless.ts`**

Update the import on line 1 from `import type { VlessNode } from '../types';` — the relative path stays the same (`../types`) because `src/shared/parsers/vless.ts` → `src/shared/types.ts`.

- [ ] **Step 2: Copy `tests/lib/parsers/vless.test.ts` to `tests/shared/parsers/vless.test.ts` with updated imports**

```ts
import { describe, it, expect } from 'vitest';
import { parseVlessLink } from '@/shared/parsers/vless';

describe('vless parser', () => {
  it('should parse basic vless link', () => {
    const link = 'vless://uuid-123@example.com:443?encryption=none#TestNode';
    const node = parseVlessLink(link);

    expect(node.name).toBe('TestNode');
    expect(node.server).toBe('example.com');
    expect(node.port).toBe(443);
    expect(node.uuid).toBe('uuid-123');
  });

  it('should parse vless with tls', () => {
    const link = 'vless://uuid@host:443?security=tls&sni=example.com#Node';
    const node = parseVlessLink(link);

    expect(node.tls).toBe(true);
    expect(node.sni).toBe('example.com');
  });

  it('should parse vless with websocket', () => {
    const link = 'vless://uuid@host:443?type=ws&path=/path&host=ws.example.com#Node';
    const node = parseVlessLink(link);

    expect(node.network).toBe('ws');
    expect(node.wsPath).toBe('/path');
    expect(node.wsHost).toBe('ws.example.com');
  });

  it('should throw error for invalid link', () => {
    expect(() => parseVlessLink('invalid')).toThrow();
    expect(() => parseVlessLink('vmess://test')).toThrow();
  });
});
```

- [ ] **Step 3: Run the test**

Run: `npx vitest run tests/shared/parsers/vless.test.ts`
Expected: 4 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/shared/parsers/vless.ts tests/shared/parsers/vless.test.ts
git commit -m "refactor: move vless parser + tests to src/shared"
```

---

### Task 10: Move parsers index

**Files:**
- Create: `src/shared/parsers/index.ts`

- [ ] **Step 1: Create `src/shared/parsers/index.ts`**

```ts
export { parseVlessLink } from './vless';
```

- [ ] **Step 2: Commit**

```bash
git add src/shared/parsers/index.ts
git commit -m "refactor: add parsers barrel export under src/shared"
```

---

### Task 11: Move rules

**Files:**
- Create: `src/shared/rules.ts`
- Create: `tests/shared/rules.test.ts`

- [ ] **Step 1: Copy `src/lib/rules.ts` to `src/shared/rules.ts`**

No imports to change — file only exports types and a constant `ruleTemplates`.

- [ ] **Step 2: Write `tests/shared/rules.test.ts` (the rule data was previously untested)**

```ts
import { describe, it, expect } from 'vitest';
import { ruleTemplates } from '@/shared/rules';

describe('ruleTemplates', () => {
  it('exposes the four expected templates', () => {
    expect(Object.keys(ruleTemplates).sort()).toEqual([
      'balanced',
      'global',
      'minimal',
      'pure',
    ]);
  });

  it('every template has id, name, description, rules', () => {
    for (const tpl of Object.values(ruleTemplates)) {
      expect(tpl.id).toBeTruthy();
      expect(tpl.name).toBeTruthy();
      expect(tpl.description).toBeTruthy();
      expect(Array.isArray(tpl.rules)).toBe(true);
      expect(tpl.rules.length).toBeGreaterThan(0);
    }
  });

  it('templates referencing RULE-SET have matching ruleUrls', () => {
    for (const tpl of Object.values(ruleTemplates)) {
      for (const rule of tpl.rules) {
        if (rule.startsWith('RULE-SET,')) {
          const setName = rule.split(',')[1];
          expect(tpl.ruleUrls?.[setName]).toBeTruthy();
        }
      }
    }
  });
});
```

- [ ] **Step 3: Run the test**

Run: `npx vitest run tests/shared/rules.test.ts`
Expected: 3 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/shared/rules.ts tests/shared/rules.test.ts
git commit -m "refactor: move rule templates + add coverage"
```

---

### Task 12: Move clash generator + run existing tests

**Files:**
- Create: `src/shared/generators/clash.ts`
- Create: `tests/shared/generators/clash.test.ts`

- [ ] **Step 1: Copy `src/lib/generators/clash.ts` to `src/shared/generators/clash.ts`**

The imports stay relative:
- Line 1 `import type { ... } from '../types';` resolves to `src/shared/types.ts`. No change.
- Line 2 `import { ruleTemplates } from '../rules';` resolves to `src/shared/rules.ts`. No change.

- [ ] **Step 2: Copy `tests/lib/generators/clash.test.ts` to `tests/shared/generators/clash.test.ts` with updated imports**

Replace the two `@/lib/...` import lines:

```ts
import { describe, it, expect } from 'vitest';
import { generateClashConfig } from '@/shared/generators/clash';
import type { VlessNode, SubscriptionData } from '@/shared/types';
```

The remainder of the test file (5 tests) stays identical — see `tests/lib/generators/clash.test.ts` lines 5-109.

- [ ] **Step 3: Run the test (this calls the live `fetchRules` against jsdelivr)**

Run: `npx vitest run tests/shared/generators/clash.test.ts`
Expected: 5 tests pass. If a network failure occurs on the `balanced` test, retry — the test depends on cdn.jsdelivr.net being reachable.

- [ ] **Step 4: Commit**

```bash
git add src/shared/generators/clash.ts tests/shared/generators/clash.test.ts
git commit -m "refactor: move clash generator + tests to src/shared"
```

---

### Task 13: Implement `functions/api/sub.ts` Pages Function (TDD)

**Files:**
- Create: `tests/functions/api/sub.test.ts`
- Create: `functions/api/sub.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/functions/api/sub.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onRequestGet } from '../../../functions/api/sub';
import { encodeSubscriptionData } from '@/shared/encoder';
import type { SubscriptionData } from '@/shared/types';

function makeContext(url: string): Parameters<typeof onRequestGet>[0] {
  return {
    request: new Request(url, { method: 'GET' }),
  } as Parameters<typeof onRequestGet>[0];
}

describe('functions/api/sub', () => {
  beforeEach(() => {
    // Stub fetch so the clash generator's RULE-SET expansion doesn't hit the network.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response('payload:\n  - example.com\n', { status: 200 }),
    ));
  });

  it('returns 400 when data param is missing', async () => {
    const res = await onRequestGet(makeContext('https://app.test/api/sub'));
    expect(res.status).toBe(400);
  });

  it('returns 400 when data is unparseable', async () => {
    const res = await onRequestGet(
      makeContext('https://app.test/api/sub?data=not-base64'),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when no valid links decode', async () => {
    const data: SubscriptionData = {
      links: ['not-a-vless-link'],
      template: 'pure',
      client: 'clash',
    };
    const encoded = encodeSubscriptionData(data);
    const res = await onRequestGet(
      makeContext(`https://app.test/api/sub?data=${encoded}`),
    );
    expect(res.status).toBe(400);
  });

  it('returns yaml with 200 for a valid vless link', async () => {
    const data: SubscriptionData = {
      links: ['vless://uuid@example.com:443?encryption=none#TestNode'],
      template: 'pure',
      client: 'clash',
    };
    const encoded = encodeSubscriptionData(data);
    const res = await onRequestGet(
      makeContext(`https://app.test/api/sub?data=${encoded}`),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toMatch(/yaml/);
    const body = await res.text();
    expect(body).toContain('proxies:');
    expect(body).toContain('TestNode');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/functions/api/sub.test.ts`
Expected: FAIL with `Cannot find module '../../../functions/api/sub'`.

- [ ] **Step 3: Implement the Pages Function**

Create `functions/api/sub.ts`:

```ts
import yaml from 'js-yaml';
import { decodeSubscriptionData } from '@/shared/encoder';
import { parseVlessLink } from '@/shared/parsers/vless';
import { generateClashConfig } from '@/shared/generators/clash';
import type { VlessNode } from '@/shared/types';

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const data = url.searchParams.get('data');

  if (!data) {
    return Response.json({ error: 'Missing data parameter' }, { status: 400 });
  }

  let subscriptionData;
  try {
    subscriptionData = decodeSubscriptionData(data);
  } catch {
    return Response.json({ error: 'Invalid encoded data' }, { status: 400 });
  }

  const nodes: VlessNode[] = subscriptionData.links
    .map((link) => {
      try {
        return parseVlessLink(link);
      } catch (err) {
        console.error(`Failed to parse link: ${link}`, err);
        return null;
      }
    })
    .filter((n): n is VlessNode => n !== null);

  if (nodes.length === 0) {
    return Response.json(
      { error: 'No valid proxy links found' },
      { status: 400 },
    );
  }

  try {
    const clashConfig = await generateClashConfig(nodes, subscriptionData);
    const body = yaml.dump(clashConfig, { lineWidth: -1, noRefs: true });

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/yaml; charset=utf-8',
        'Content-Disposition': 'attachment; filename=clash.yaml',
        'Subscription-Userinfo': 'upload=0; download=0; total=0; expire=0',
      },
    });
  } catch (err) {
    console.error('Subscription API error:', err);
    return Response.json(
      { error: 'Failed to generate subscription' },
      { status: 500 },
    );
  }
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/functions/api/sub.test.ts`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add functions/api/sub.ts tests/functions/api/sub.test.ts
git commit -m "feat: add /api/sub Pages Function with full test coverage"
```

---

### Task 14: Add `index.html`

**Files:**
- Create: `index.html`

- [ ] **Step 1: Write `index.html` (root of project, not in `public/`)**

```html
<!doctype html>
<html lang="zh" data-theme="modern">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SubCraft - 订阅转换工具</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
      rel="stylesheet"
    />
    <script>
      (function () {
        try {
          var theme = localStorage.getItem('app-theme') || 'modern';
          var dark = localStorage.getItem('app-dark-mode');
          document.documentElement.setAttribute('data-theme', theme);
          if (
            dark === 'true' ||
            (dark === null &&
              window.matchMedia('(prefers-color-scheme: dark)').matches)
          ) {
            document.documentElement.classList.add('dark');
          }
        } catch (e) {}
      })();
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: add SPA index.html with theme bootstrap"
```

---

### Task 15: Move global styles

**Files:**
- Create: `src/styles/globals.css`

- [ ] **Step 1: Copy `src/app/globals.css` to `src/styles/globals.css`**

No content changes — copy verbatim.

- [ ] **Step 2: Commit**

```bash
git add src/styles/globals.css
git commit -m "refactor: move globals.css to src/styles/"
```

---

### Task 16: Create `src/main.tsx` (React entry)

**Files:**
- Create: `src/main.tsx`

- [ ] **Step 1: Write `src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/globals.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root container missing');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 2: Commit**

```bash
git add src/main.tsx
git commit -m "feat: add SPA entry point"
```

---

### Task 17: Create `src/App.tsx` root component

**Files:**
- Create: `src/App.tsx`

- [ ] **Step 1: Write `src/App.tsx`**

```tsx
import { SubscriptionForm } from './components/SubscriptionForm';
import { ThemeSwitcher } from './components/ThemeSwitcher';

export function App() {
  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold">SubCraft</h1>
          <p className="text-sm text-muted-foreground">
            无状态的代理订阅转换工具
          </p>
        </div>
        <SubscriptionForm />
      </main>
      <div
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border px-3 py-2 shadow-lg"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        <ThemeSwitcher />
      </div>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add App root component"
```

---

### Task 18: Migrate `SubscriptionForm` component

**Files:**
- Create: `src/components/SubscriptionForm.tsx`

- [ ] **Step 1: Write `src/components/SubscriptionForm.tsx`**

Differences from `src/components/subscription-form.tsx`:
1. Drop the `'use client'` directive (Vite has no SSR).
2. Change `@/lib/encoder` → `@/shared/encoder`.
3. Change `@/lib/rules` → `@/shared/rules`.
4. Change `@/lib/types` → `@/shared/types`.
5. Replace `process.env.NEXT_PUBLIC_APP_URL` (line 58) with `import.meta.env.VITE_APP_URL`.

```tsx
import { useState } from 'react';
import { encodeSubscriptionData } from '@/shared/encoder';
import { ruleTemplates } from '@/shared/rules';
import type { RuleTemplate } from '@/shared/types';

export function SubscriptionForm() {
  const [links, setLinks] = useState('');
  const [template, setTemplate] = useState<RuleTemplate>('balanced');
  const [subscriptionUrl, setSubscriptionUrl] = useState('');
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mixedPort, setMixedPort] = useState(7890);
  const [allowLan, setAllowLan] = useState(false);
  const [mode, setMode] = useState<'rule' | 'global' | 'direct'>('rule');
  const [enableDns, setEnableDns] = useState(true);
  const [fakeIpFilter, setFakeIpFilter] = useState('*.lan\n*.local\n*.localhost');
  const [nameserver, setNameserver] = useState('119.29.29.29\n223.5.5.5');
  const [fallback, setFallback] = useState('tls://1.1.1.1:853\ntls://8.8.8.8:853');

  const handleGenerate = () => {
    try {
      setError('');

      const linkArray = links
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (linkArray.length === 0) {
        setError('请至少输入一个代理链接');
        return;
      }

      const encoded = encodeSubscriptionData({
        links: linkArray,
        template,
        client: 'clash',
        baseConfig: {
          mixedPort,
          allowLan,
          mode,
          logLevel: 'info',
          ipv6: false,
        },
        dnsOptions: {
          enable: enableDns,
          ipv6: false,
          enhancedMode: 'fake-ip',
          fakeIpRange: '198.18.0.1/16',
          fakeIpFilter: fakeIpFilter.split('\n').map((s) => s.trim()).filter((s) => s),
          nameserver: nameserver.split('\n').map((s) => s.trim()).filter((s) => s),
          fallback: fallback.split('\n').map((s) => s.trim()).filter((s) => s),
        },
      });

      const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const url = `${baseUrl}/api/sub?data=${encoded}`;
      setSubscriptionUrl(url);
    } catch (err) {
      console.error('生成失败:', err);
      setError('生成订阅链接失败');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(subscriptionUrl);
      alert('已复制到剪贴板');
    } catch {
      alert('复制失败，请手动复制');
    }
  };

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">代理链接（每行一个）</label>
        <textarea
          value={links}
          onChange={(e) => setLinks(e.target.value)}
          placeholder="vless://uuid@example.com:443?encryption=none#节点名称"
          className="w-full h-32 px-3 py-2 rounded-md border resize-none font-mono text-sm"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text)',
          }}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">规则模板</label>
        <select
          value={template}
          onChange={(e) => setTemplate(e.target.value as RuleTemplate)}
          className="w-full px-3 py-2 rounded-md border"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text)',
          }}
        >
          {Object.values(ruleTemplates).map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} - {t.description}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        {showAdvanced ? '隐藏' : '显示'}高级配置
      </button>

      {showAdvanced && (
        <div className="space-y-4 p-4 rounded-md border" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-semibold">基础配置</h3>

          <div className="space-y-2">
            <label className="text-sm font-medium">代理端口</label>
            <input
              type="number"
              value={mixedPort}
              onChange={(e) => setMixedPort(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-md border"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            />
            <p className="text-xs text-muted-foreground">HTTP + SOCKS5 混合端口，默认 7890</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allowLan"
              checked={allowLan}
              onChange={(e) => setAllowLan(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="allowLan" className="text-sm font-medium">允许局域网连接</label>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">代理模式</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'rule' | 'global' | 'direct')}
              className="w-full px-3 py-2 rounded-md border"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            >
              <option value="rule">规则模式</option>
              <option value="global">全局代理</option>
              <option value="direct">直连模式</option>
            </select>
          </div>

          <h3 className="text-sm font-semibold mt-4">DNS 配置</h3>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enableDns"
              checked={enableDns}
              onChange={(e) => setEnableDns(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="enableDns" className="text-sm font-medium">启用 DNS</label>
          </div>

          {enableDns && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Fake-IP 过滤列表</label>
                <textarea
                  value={fakeIpFilter}
                  onChange={(e) => setFakeIpFilter(e.target.value)}
                  placeholder="*.lan&#10;*.local&#10;*.ts.net"
                  className="w-full h-24 px-3 py-2 rounded-md border resize-none font-mono text-sm"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  这些域名不走 fake-ip，直接用真实 DNS 解析（每行一个）
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">DNS 服务器（国内）</label>
                <textarea
                  value={nameserver}
                  onChange={(e) => setNameserver(e.target.value)}
                  placeholder="119.29.29.29&#10;223.5.5.5"
                  className="w-full h-20 px-3 py-2 rounded-md border resize-none font-mono text-sm"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                />
                <p className="text-xs text-muted-foreground">用于解析国内域名（每行一个）</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">备用 DNS（国外）</label>
                <textarea
                  value={fallback}
                  onChange={(e) => setFallback(e.target.value)}
                  placeholder="tls://1.1.1.1:853&#10;tls://8.8.8.8:853"
                  className="w-full h-20 px-3 py-2 rounded-md border resize-none font-mono text-sm"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                />
                <p className="text-xs text-muted-foreground">用于解析国外域名（每行一个）</p>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleGenerate}
        className="w-full h-10 rounded-md font-medium text-white transition-all active:scale-[0.99]"
        style={{ background: 'var(--primary)' }}
      >
        生成订阅链接
      </button>

      {subscriptionUrl && (
        <div className="space-y-2">
          <label className="text-sm font-medium">订阅链接</label>
          <div className="flex gap-2">
            <input
              value={subscriptionUrl}
              readOnly
              className="flex-1 px-3 py-2 rounded-md border font-mono text-sm"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            />
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-md border font-medium transition-all active:scale-[0.99]"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            >
              复制
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            将此链接添加到 Clash 客户端即可使用
          </p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SubscriptionForm.tsx
git commit -m "feat: port SubscriptionForm to Vite SPA imports"
```

---

### Task 19: Migrate `ThemeSwitcher` component

**Files:**
- Create: `src/components/ThemeSwitcher.tsx`

- [ ] **Step 1: Write `src/components/ThemeSwitcher.tsx`**

Drop `'use client'`. Imports stay aliased to `@/lib/theme` (theme.ts is frontend-only and remains under `src/lib/`).

```tsx
import { useCallback, useSyncExternalStore } from 'react';
import { Moon, Sun, Palette } from 'lucide-react';
import {
  type ThemeName,
  THEMES,
  getStoredTheme,
  getStoredDarkMode,
  saveTheme,
  subscribeTheme,
} from '@/lib/theme';

export function ThemeSwitcher() {
  const theme = useSyncExternalStore(subscribeTheme, getStoredTheme, () => 'modern');
  const isDark = useSyncExternalStore(subscribeTheme, getStoredDarkMode, () => false);

  const handleThemeChange = useCallback((newTheme: ThemeName) => {
    saveTheme(newTheme, getStoredDarkMode());
  }, []);

  const handleToggleDark = useCallback(() => {
    saveTheme(getStoredTheme(), !getStoredDarkMode());
  }, []);

  return (
    <div className="inline-flex items-center gap-2">
      <div className="relative">
        <select
          value={theme}
          onChange={(e) => handleThemeChange(e.target.value as ThemeName)}
          className="h-9 appearance-none rounded-md border bg-transparent px-3 pr-8 text-sm outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring/50 cursor-pointer"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text)',
          }}
        >
          {THEMES.map((t) => (
            <option key={t.name} value={t.name}>
              {t.label}
            </option>
          ))}
        </select>
        <Palette
          className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2"
          style={{ color: 'var(--muted)' }}
        />
      </div>

      <button
        onClick={handleToggleDark}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--muted)',
        }}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ThemeSwitcher.tsx
git commit -m "feat: port ThemeSwitcher to Vite SPA"
```

---

### Task 20: Replace ESLint config

**Files:**
- Modify: `eslint.config.mjs`

- [ ] **Step 1: Overwrite `eslint.config.mjs`**

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['dist', '.wrangler', 'node_modules'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}', 'functions/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
    },
  },
);
```

- [ ] **Step 2: Run lint (expect failures from old `src/app/`)**

Run: `npm run lint`
Expected: errors in old Next.js files. Note them — they will be deleted in Task 27.

- [ ] **Step 3: Commit**

```bash
git add eslint.config.mjs
git commit -m "build: replace next-eslint with flat tseslint config"
```

---

### Task 21: Update `.env*` files

**Files:**
- Modify: `.env.example`
- Modify: `.env.local`
- Modify: `.env`

- [ ] **Step 1: Replace `NEXT_PUBLIC_APP_URL=` with `VITE_APP_URL=` in all three files**

For each file: replace the literal token `NEXT_PUBLIC_APP_URL` with `VITE_APP_URL`. Leave other variables untouched.

If a file does not exist, skip it.

- [ ] **Step 2: Verify**

Run: `grep -l NEXT_PUBLIC_APP_URL .env .env.local .env.example 2>/dev/null || echo "clean"`
Expected: `clean`.

- [ ] **Step 3: Commit (only `.env.example` is tracked; `.env*` are gitignored)**

```bash
git add .env.example
git commit -m "build: rename NEXT_PUBLIC_APP_URL to VITE_APP_URL"
```

---

### Task 22: Local dev verification (frontend + functions)

**Files:**
- None (verification task).

- [ ] **Step 1: Start the functions server in one terminal**

Run: `npm run dev:functions`
Expected: `Ready on http://localhost:8788`. Leave running.

- [ ] **Step 2: Start the Vite dev server in another terminal**

Run: `npm run dev`
Expected: `Local: http://localhost:5173/`.

- [ ] **Step 3: Manual smoke check**

1. Open `http://localhost:5173/` in a browser.
2. Paste a sample link `vless://test-uuid@example.com:443?encryption=none&security=tls&sni=example.com#TestNode`.
3. Pick template "纯净模式".
4. Click "生成订阅链接".
5. Visit the generated URL.

Expected: YAML response with `proxies: - name: TestNode` etc.

- [ ] **Step 4: Stop both servers (Ctrl+C in each terminal)**

- [ ] **Step 5: No commit (verification only)**

---

### Task 23: Build verification

**Files:**
- None.

- [ ] **Step 1: Run production build**

Run: `npm run build`
Expected: `dist/` directory created with `index.html`, `assets/*.js`, `assets/*.css`.

- [ ] **Step 2: Run preview**

Run: `npm run preview`
Expected: `Ready on http://localhost:3000`. Functions and static assets both served by wrangler.

- [ ] **Step 3: Repeat the smoke check from Task 22 against `http://localhost:3000`**

Expected: same successful YAML output.

- [ ] **Step 4: Stop preview server**

- [ ] **Step 5: No commit (verification only)**

---

### Task 24: Run full test + typecheck + lint suite

**Files:**
- None.

- [ ] **Step 1: Run vitest**

Run: `npm test -- --run`
Expected: all tests pass (encoder 3, vless 4, rules 3, clash 5, functions/sub 4 = 19 tests).

- [ ] **Step 2: Run typecheck**

Run: `npm run tsc`
Expected: no errors. (If errors come from old `src/app/` files, defer until Task 27.)

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: no errors. (Same caveat: ignore Next.js residue.)

- [ ] **Step 4: No commit (verification only)**

---

### Task 25: Replace GitHub Actions workflow

**Files:**
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: Overwrite the workflow**

```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run tsc
      - run: npm test -- --run

  deploy:
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
        env:
          VITE_APP_URL: ${{ vars.VITE_APP_URL }}
      - name: Publish to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=subcraft
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: replace Docker build with Cloudflare Pages deploy"
```

> **Note for the operator:** Configure the GitHub repo with:
> - Variables: `VITE_APP_URL`
> - Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
> Old GHCR-related secrets can be removed once the workflow is green.

---

### Task 26: Update `README.md`

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Edit `README.md`**

Make these specific edits (replace whole sections, do not append):

1. Under "技术栈" — replace the bullet list with:
```
- Vite 5 + React 19 + TypeScript
- Tailwind CSS v4
- Cloudflare Pages + Pages Functions
- Wrangler CLI for deploy
```

2. Under "快速开始 → 4. 本地开发" — replace the block with:
```
两个终端分别运行:

# 终端 1：Pages Functions
npm run dev:functions

# 终端 2：Vite SPA
npm run dev

访问 http://localhost:5173
```

3. Replace the entire "Docker 部署" section (header + body) with:

```
## Cloudflare Pages 部署

### 手动部署

\`\`\`bash
npm run build
npx wrangler pages deploy dist --project-name=subcraft
\`\`\`

### 自动部署

GitHub Actions 在 main 分支推送时自动 \`wrangler pages deploy dist\`。
所需 GitHub Secrets：
- \`CLOUDFLARE_API_TOKEN\`
- \`CLOUDFLARE_ACCOUNT_ID\`

GitHub Variables：
- \`VITE_APP_URL\`
```

4. Update "项目结构" to reflect the new layout:
```
.
├── src/
│   ├── main.tsx                  # SPA 入口
│   ├── App.tsx                   # 根组件
│   ├── components/
│   │   ├── SubscriptionForm.tsx
│   │   └── ThemeSwitcher.tsx
│   ├── lib/                      # 仅前端使用（theme, utils）
│   ├── shared/                   # 前后端共享
│   │   ├── encoder.ts
│   │   ├── parsers/
│   │   ├── generators/
│   │   ├── rules.ts
│   │   └── types.ts
│   └── styles/globals.css
├── functions/
│   └── api/sub.ts                # CF Pages Function
├── tests/
├── index.html
├── vite.config.ts
├── wrangler.toml
└── package.json
```

5. In the "脚本" table, replace existing rows with:

| 命令 | 说明 |
|------|------|
| `npm run dev` | Vite SPA 开发服务器 (5173) |
| `npm run dev:functions` | Pages Functions 服务器 (8788) |
| `npm run build` | 生产构建到 `dist/` |
| `npm run preview` | 本地预览生产构建 (3000) |
| `npm run deploy` | 部署到 Cloudflare Pages |
| `npm run lint` | ESLint 检查 |
| `npm run tsc` | TypeScript 类型检查 |
| `npm test` | 运行 vitest |

6. Drop "GitHub Owner / 镜像地址 / GHCR" — they no longer apply.

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: rewrite README for Cloudflare Pages deployment"
```

---

### Task 27: Delete Next.js artifacts

**Files:**
- Delete (whole directories): `src/app/`, `src/components/ui/`, `src/lib/parsers/`, `src/lib/generators/`, `tests/lib/`, `.next/`
- Delete (single files): `src/components/subscription-form.tsx`, `src/components/theme-switcher.tsx`, `src/lib/encoder.ts`, `src/lib/types.ts`, `src/lib/rules.ts`, `next.config.ts`, `next-env.d.ts`, `Dockerfile`, `docker-compose.yml`, `docker-compose.override.yml`, `docker-entrypoint.sh`, `.dockerignore`, `components.json`, `postcss.config.mjs`, `tsconfig.tsbuildinfo`

- [ ] **Step 1: Remove the directories and files**

```bash
rm -rf src/app src/components/ui src/lib/parsers src/lib/generators tests/lib .next
rm -f src/components/subscription-form.tsx src/components/theme-switcher.tsx
rm -f src/lib/encoder.ts src/lib/types.ts src/lib/rules.ts
rm -f next.config.ts next-env.d.ts
rm -f Dockerfile docker-compose.yml docker-compose.override.yml docker-entrypoint.sh .dockerignore
rm -f components.json postcss.config.mjs tsconfig.tsbuildinfo
```

- [ ] **Step 2: Update `.gitignore`**

Replace the line `.next` with `dist` and add `.wrangler` if missing. Open `.gitignore`, remove the `.next` line, and ensure `dist`, `.wrangler/`, `node_modules` are present.

- [ ] **Step 3: Re-run the full test + typecheck + lint suite**

Run:
```bash
npm test -- --run
npm run tsc
npm run lint
```

Expected: all green.

- [ ] **Step 4: Re-run the manual smoke check (Task 22 steps 1-3)**

Expected: identical YAML output to before.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove Next.js artifacts (app/, ui/, lib/, Dockerfile, etc.)"
```

---

### Task 28: Open PR and tag for review

**Files:**
- None.

- [ ] **Step 1: Push branch**

```bash
git push -u origin cloudflare-pages-rewrite
```

- [ ] **Step 2: Open a PR (or hand off to user)**

```bash
gh pr create --title "Rewrite to Cloudflare Pages (Vite + Pages Functions)" --body "$(cat <<'EOF'
## Summary
- Replaces Next.js 16 with Vite 5 + React 19 SPA
- Single API route reimplemented as a Cloudflare Pages Function (\`functions/api/sub.ts\`)
- Pure logic (encoder/parsers/generators/rules/types) lives under \`src/shared/\` and is imported by both the SPA and the function
- Docker / GHCR / Traefik stack removed in favor of \`wrangler pages deploy\`

## Test plan
- [ ] \`npm test\` passes (19 tests)
- [ ] \`npm run tsc\` passes
- [ ] \`npm run lint\` passes
- [ ] Manual smoke: paste vless link in dev → submit → fetch generated URL → valid YAML
- [ ] CF Pages preview deploy from PR succeeds

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Done — wait for review**

---

## Self-Review Notes

- **Spec coverage:** Frontend (Vite SPA), backend (one Pages Function), shared logic move, dev experience (proxy), build, deploy (CF Pages workflow), tests (all preserved + one new test), README + CI updated, full removal of Next.js — all covered.
- **No placeholders:** every code-changing step contains the exact code or the exact diff intent. The only references to "see existing file" are for the clash test body where we explicitly redirect to specific line numbers.
- **Type/identifier consistency:** `SubscriptionData`, `VlessNode`, `RuleTemplate`, `parseVlessLink`, `generateClashConfig`, `encodeSubscriptionData`, `decodeSubscriptionData`, `ruleTemplates`, `onRequestGet` are all used identically across tasks.

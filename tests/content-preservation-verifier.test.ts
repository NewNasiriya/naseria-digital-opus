import { afterEach, expect, test } from "bun:test";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const temporaryRepositories: string[] = [];
afterEach(() => {
  for (const path of temporaryRepositories.splice(0))
    rmSync(path, { recursive: true, force: true });
});

function git(cwd: string, ...args: string[]) {
  return execFileSync("git", args, { cwd, encoding: "utf8" });
}

test("verifier rejects a prohibited reference in a committed PR diff", () => {
  const repo = mkdtempSync(join(tmpdir(), "preservation-fixture-"));
  temporaryRepositories.push(repo);
  for (const dir of ["docs", "src/components/home", "src/cms", "src/lib", "supabase/migrations"])
    mkdirSync(join(repo, dir), { recursive: true });
  writeFileSync(join(repo, "docs/cms-frontend-backend-content-map.md"), "baseline\n");
  writeFileSync(join(repo, "docs/cms-action-matrix.md"), "baseline\n");
  writeFileSync(
    join(repo, "src/components/home/Hero.tsx"),
    'import { resolveHeroIntro } from "@/lib/homepage-hero-fallback"; function Hero({intro}){ return <p>{resolveHeroIntro(intro)}</p> }\n',
  );
  writeFileSync(
    join(repo, "src/lib/homepage-hero-fallback.ts"),
    "const DEFAULT_HOMEPAGE_INTRO='safe'; export function resolveHeroIntro(intro){ return intro?.trim() || DEFAULT_HOMEPAGE_INTRO }\n",
  );
  writeFileSync(join(repo, "src/cms/media-replacement.ts"), "export const safe = true;\n");
  writeFileSync(
    join(repo, "src/cms/content-preservation.ts"),
    "export const NORMAL_CMS_PERMANENT_DELETE_AVAILABLE = false;\n",
  );
  git(repo, "init", "-b", "main");
  git(repo, "config", "user.email", "fixture@example.invalid");
  git(repo, "config", "user.name", "Fixture");
  git(repo, "add", ".");
  git(repo, "commit", "-m", "baseline");
  git(repo, "switch", "-c", "phase-a");
  mkdirSync(join(repo, "src/config"), { recursive: true });
  const prohibitedProjectRef = ["twixqnbg", "mcelbkryoezg"].join("");
  writeFileSync(
    join(repo, "src/config/prohibited.ts"),
    `export const project = '${prohibitedProjectRef}';\n`,
  );
  git(repo, "add", ".");
  git(repo, "commit", "-m", "prohibited committed change");

  const result = spawnSync(
    process.execPath,
    [resolve("scripts/verify-production-content-preservation.mjs")],
    {
      cwd: resolve("."),
      env: { ...process.env, PRESERVATION_REPO_ROOT: repo, PRESERVATION_BASE_REF: "main" },
      encoding: "utf8",
    },
  );
  expect(result.status).toBe(1);
  expect(result.stdout).toContain("✗ prohibited empty-project reference was not added");
  expect(result.stdout).toContain("Checked committed range:");
});

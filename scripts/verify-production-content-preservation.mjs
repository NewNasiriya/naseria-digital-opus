import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";

const root = resolve(
  process.env.PRESERVATION_REPO_ROOT || fileURLToPath(new URL("../", import.meta.url)),
);
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trimEnd();
const hasRef = (ref) => {
  try {
    execFileSync("git", ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`], {
      cwd: root,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
};

function resolveBaseRef() {
  const supplied = process.env.PRESERVATION_BASE_REF;
  if (supplied) {
    if (!hasRef(supplied))
      throw new Error(`PRESERVATION_BASE_REF does not resolve to a commit: ${supplied}`);
    return supplied;
  }
  if (hasRef("origin/main")) return "origin/main";
  if (hasRef("main")) return "main";
  throw new Error(
    "Unable to determine preservation baseline. Set PRESERVATION_BASE_REF, fetch origin/main, or create a local main ref.",
  );
}

let baseRef;
let mergeBase;
try {
  baseRef = resolveBaseRef();
  mergeBase = git("merge-base", "HEAD", baseRef);
  if (!mergeBase) throw new Error(`No merge base between HEAD and ${baseRef}`);
} catch (error) {
  console.error(
    `Preservation verification failed closed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(2);
}

const range = `${mergeBase}...HEAD`;
const nameStatus = git("diff", "--name-status", "--find-renames", range);
const patch = git("diff", "--no-ext-diff", "--unified=0", range);
const addedLines = patch
  .split("\n")
  .filter((line) => line.startsWith("+") && !line.startsWith("+++ "))
  .map((line) => line.slice(1))
  .join("\n");
const changes = nameStatus
  ? nameStatus.split("\n").map((line) => {
      const [status, ...paths] = line.split("\t");
      return { status, paths };
    })
  : [];
const touched = (predicate) => changes.some(({ paths }) => paths.some(predicate));
const failures = [];
const check = (ok, message) => {
  console.log(`${ok ? "✓" : "✗"} ${message}`);
  if (!ok) failures.push(message);
};
const read = (path) => readFileSync(resolve(root, path), "utf8");

console.log(`Preservation base: ${baseRef}`);
console.log(`Merge base: ${mergeBase}`);
console.log(`Checked committed range: ${range}`);

check(
  !touched((p) => p.startsWith("public/lovable-assets/")),
  "Lovable assets were not deleted, renamed, or modified",
);
check(
  !touched((p) => p.startsWith("supabase/migrations/")),
  "historical migrations were not modified, renamed, or deleted",
);
check(
  !touched((p) => p === "supabase/config.toml"),
  "Supabase project configuration was not modified",
);
const environmentFile = (p) => /(^|\/)(\.env(?:\..*)?|[^/]*(?:secret|credentials?)[^/]*)$/i.test(p);
check(
  !touched(environmentFile),
  "no environment or tracked secret file was introduced or modified",
);
const prohibitedProjectRef = ["twixqnbg", "mcelbkryoezg"].join("");
check(
  !addedLines.includes(prohibitedProjectRef),
  "prohibited empty-project reference was not added",
);
check(
  !/(?:service[_-]?role|SUPABASE_SERVICE_ROLE_KEY|sb_secret_)\s*[=:]?\s*["']?[A-Za-z0-9._-]{12,}/i.test(
    addedLines,
  ),
  "no service-role or secret-key pattern was added",
);
check(
  !changes.some(
    ({ status, paths }) =>
      status.startsWith("D") &&
      paths.some((p) => p.startsWith("src/components/") || p.startsWith("src/routes/")),
  ),
  "no visible public component or route was deleted",
);
check(
  existsSync(resolve(root, "docs/cms-frontend-backend-content-map.md")),
  "frontend/backend content map exists",
);
check(existsSync(resolve(root, "docs/cms-action-matrix.md")), "CMS action matrix exists");
const hero = read("src/components/home/Hero.tsx");
const heroFallback = read("src/lib/homepage-hero-fallback.ts");
check(
  heroFallback.includes("return intro?.trim() || DEFAULT_HOMEPAGE_INTRO") &&
    hero.includes('from "@/lib/homepage-hero-fallback"') &&
    hero.includes("{resolveHeroIntro(intro)}"),
  "actual public hero introduction fallback remains intact",
);
const replacement = read("src/cms/media-replacement.ts");
check(
  !replacement.includes("storage.remove") && !replacement.includes(".remove(["),
  "safe replacement never removes Storage objects",
);
check(
  read("src/cms/content-preservation.ts").includes("NORMAL_CMS_PERMANENT_DELETE_AVAILABLE = false"),
  "normal CMS permanent delete remains disabled",
);

if (failures.length) {
  console.error(`\nProduction content preservation failed (${failures.length}) against ${range}.`);
  process.exit(1);
}
console.log(`\nProduction content preservation passed against committed PR diff ${range}.`);

// Keep this module directly executable while allowing fixture imports without side effects.
export { resolveBaseRef };

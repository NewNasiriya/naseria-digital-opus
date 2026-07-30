import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const runGit = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" });
const tracked = runGit("ls-files").trim().split("\n").filter(Boolean);
const failures = [];
const pass = (ok, message) => {
  console.log(`${ok ? "✓" : "✗"} ${message}`);
  if (!ok) failures.push(message);
};
const read = (path) => readFileSync(new URL(path, root), "utf8");

const lovable = tracked.filter((p) => p.startsWith("public/lovable-assets/"));
pass(
  lovable.length >= 40 && lovable.every((p) => existsSync(new URL(p, root))),
  `all ${lovable.length} tracked Lovable assets remain (baseline ≥ 40)`,
);
pass(
  !runGit("diff", "--name-status", "HEAD", "--", "public", "src/components")
    .split("\n")
    .some((l) => l.startsWith("D\t")),
  "no public asset or public component is deleted",
);
pass(
  existsSync(new URL("docs/cms-frontend-backend-content-map.md", root)),
  "frontend/backend content map exists",
);
pass(existsSync(new URL("docs/cms-action-matrix.md", root)), "CMS action matrix exists");
pass(
  read("src/cms/content-preservation.ts").includes("preserveFallback") &&
    read("src/routes/index.tsx").includes("<Hero intro="),
  "key homepage content retains an enforceable fallback path",
);
pass(
  read("src/cms/media-replacement.ts").indexOf("archive(target.oldMediaId)") >
    read("src/cms/media-replacement.ts").indexOf("readLinkedMediaId"),
  "new media is linked and verified before old metadata archive",
);
pass(
  !read("src/cms/media-replacement.ts").includes("storage.remove") &&
    !read("src/cms/media-replacement.ts").includes(".remove(["),
  "safe replacement never removes Storage objects",
);
pass(
  read("src/cms/content-preservation.ts").includes("NORMAL_CMS_PERMANENT_DELETE_AVAILABLE = false"),
  "normal CMS permanent delete is disabled",
);
pass(
  runGit("diff", "--quiet", "HEAD", "--", "supabase/config.toml") === "",
  "backend project configuration is unchanged by Phase A",
);
const sourceCorpus = tracked
  .filter((p) => /^(src|scripts)\//.test(p))
  .map((p) => read(p))
  .join("\n");
pass(
  !sourceCorpus.includes("twixqnbgmcelbkryoezg"),
  "no runtime/script connection to the empty project was introduced",
);
const diff = runGit("diff", "--cached", "--no-ext-diff") + runGit("diff", "--no-ext-diff");
pass(
  !/(service_role|sb_secret_|SUPABASE_SERVICE_ROLE_KEY)\s*[=:]\s*["'][^"']+/i.test(diff),
  "no tracked secret pattern was added",
);
pass(
  !runGit("diff", "--name-only", "HEAD", "--", "supabase/migrations").trim(),
  "historical migrations are untouched",
);

if (failures.length) {
  console.error(`\nPreservation verification failed (${failures.length}).`);
  process.exit(1);
}
console.log("\nProduction content preservation manifest passed.");

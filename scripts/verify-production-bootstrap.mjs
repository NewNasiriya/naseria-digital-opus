#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const migrationDir = path.join(root, "supabase/migrations");
const historical = {
  "20260701182124_09d21461-a20e-4710-8e60-46eb5122c336.sql":
    "af0af5b5acdd2fc479ec61d6e0ca109b29f4f8b2a741cdbaf7277798e580226f",
  "20260701182136_91959087-d83a-4876-a3b1-f087e2e4fda7.sql":
    "c91c85e94528eb297475d9fd9390e10e70e9d962ea0b030702c895c0969460fd",
  "20260701182157_c3352331-dbe8-4118-8ad5-371ef7180e92.sql":
    "6f5e4cc5b8d584f26c3f0dabf00be148271d770707093c30cb4c5c799f58356a",
  "20260701191053_7766d7a6-6b9f-4392-8d00-7a00d4aaae3d.sql":
    "b7a7001c4c5140f2d2fe1d1c761ae842da5546b498938b9d145ffed72abbddc0",
  "20260701194150_5761e74a-6e1a-42ee-90c5-a9cc58cb5ce3.sql":
    "37f5ec38f3e0ffa155e85f6fe5bd7561832c17a2fb839ce808fd81bc8b12022e",
  "20260701194205_e0ef7a56-21d0-4b52-a8c7-0f0d118d055c.sql":
    "316d67fcc9aeac6faf0a90c2fa4cd6f2bb4bbe7b4794dadfc9398228f1de55a1",
  "20260701195120_26a1ec2e-a6ce-477f-ae5e-24e02407d539.sql":
    "65b3b53d61e4430fa049d1a46589d39894c222765d7d8b865aa193d4316b0f07",
  "20260701201217_a3b51796-944a-4aa1-a549-bcb4b96a544a.sql":
    "61e1d53cc2460abdd1880ac84b1920ef689eb831081ce54704c4f3094d7202ce",
  "20260701201941_e8d02366-5529-4d17-901d-9364856cbb16.sql":
    "e9349578abeb466ea9c5889e917c0beb7447ca9f69901fe09d688117429212ad",
  "20260701202638_670dd4f2-f3b0-4eba-8149-878e62719553.sql":
    "f1cf68617fad52c761b2411dab483b873807a27f88ef8adc0476577642cdbf55",
  "20260701203833_5afdb1d7-9ecc-4e4f-aab0-567c01597532.sql":
    "220db67a7222ee048972426dd5dc3bf53bc3a66a7a02e4246ff53dad11c28bba",
  "20260701205011_a65746bd-9024-4e6f-b020-463b8a74b092.sql":
    "19f0f30d46dc342c10102b87e378bb9bdac4065aa784cf7c03b5f3f700cce425",
  "20260701223116_f69cdfde-8a3d-4403-b5e1-4d59dd08836e.sql":
    "2b47a5dfa2718ae8ab5c8aabba3bce5e41a9b88b5f6a57c7c7648e6a1981c162",
  "20260701223131_5472ee2a-7b10-4ac0-b1fc-0ae42bddf4ce.sql":
    "f541facd74fbe9d3c8fdaefc1ed90878fa1e6c1f64722c438ae018f0278c6bd3",
  "20260701225340_25e606f2-e434-42bf-b6fa-bcb557df34ae.sql":
    "f02269203a5ccea1c5a25679d6af98b0355f51d48b0c5b74190f302f6c48aac5",
  "20260701230733_ebe0010d-ca76-4eb5-b887-8bea3bd324e0.sql":
    "d4550264bceee9dd58f4980cac64c20efc54a3955a0706eca04d225d1f9e6a3d",
  "20260701232021_01fdb1b9-e2c1-4653-b9ac-35b5906b9543.sql":
    "25075febd3990362ce7df2e48822aa14396a24f5c2590c5f58104c8de48974cd",
  "20260701233224_01160a1c-432b-432f-8610-998e3056c259.sql":
    "5d7aa21a4a99be429e7398c2d68e4824f420b099d438711c026f0c4ce3efea64",
  "20260701235602_498a1316-7e51-44a2-8b84-2ccb39ff5756.sql":
    "50c2e43ea1006593bc6be6a7a3b8de2e85c66eabbc3ba1305c73f3b1334b3e9f",
  "20260702002449_fcf3f61c-d43e-479e-b730-ae94173e35f0.sql":
    "f88f7156abe7a830a2e82c19b504c8f3ab8d235cdd473db652c26879a04bc1b6",
};

// Keep the large immutable manifest readable while detecting accidental edits.
Object.assign(
  historical,
  Object.fromEntries(
    `
20260702014754_8760cd0a-a52a-4b0e-b8e4-35e000a27b1b.sql 712f089d928d34c6007707b361d1b045322e09cbd6262da9651fe0d95d3780f5
20260705000809_ea4d9f52-deb3-44d1-85a6-835559ada7e6.sql e6456dbf17657bd0cb60aa93fc6bbac25b4d799d4644a5c8ea412a5ff2d323f9
20260706000616_0e3987a6-2aea-4556-8f00-712fd3eb7cc5.sql 9b077c4470b782b7b6a9fda2701cd5b568eee1be86771e4952b3ee5f8a149c3e
20260713172744_8b21a79b-7f9e-4265-bb3a-7b1f9adff97b.sql 85d5f8192a5d673ce024fb8243ddfe58a8f510765126b65e25d7966fe2239819
20260714003121_0e05c45e-b6bb-4894-8140-98d45d3e5571.sql b0258b17b62cb6d0aa5e3bbf480d5e4bc3031d84d5e8addbc80af4847710110b
20260714003218_0f071b44-d341-4268-a69e-f4a3891d89aa.sql bee2a818b7234b0cf3db121abbf22cf3ca2ea624d02baa3564983f383fd17d46
20260715011359_e59b8339-ec9a-4029-8204-d954f4003f4c.sql 1073655fa83fcde71ed9c371cc27c407ae60de845815963568fe4db7a06d545d
20260723022640_1e6adc77-259b-4b4c-9f62-da97eae49631.sql 68d2b2c0953415e563287a5a0b92ebd5973a15963e4fbf869050441218586f79
20260724003534_b0a2cfa1-0bbf-444c-ba30-2be5ab8d4b5c.sql ce5aaa1a4ac50274a67e1602031377ac2fea2ead25555e79d8b20b9ea69dc5d4
20260725024142_8c0b9a3c-2616-4bdb-8e17-cbde4fd32f37.sql 315c0e5ec06de0116d92836e4c477e3e1fb5fb148ae959a6f4b3acf2c1c939f3
`
      .trim()
      .split("\n")
      .map((line) => line.split(" ")),
  ),
);
const failures = [];
const check = (condition, message) =>
  condition ? console.log(`PASS ${message}`) : failures.push(message);
const files = (await readdir(migrationDir)).filter((f) => f.endsWith(".sql"));
const sorted = [...files].sort();
check(new Set(files).size === files.length, "migration filenames are unique");
check(
  sorted.every((f) => /^\d{14}_[a-zA-Z0-9_-]+\.sql$/.test(f)),
  "migration filenames have sortable timestamps",
);
check(Object.keys(historical).length === 30, "historical manifest contains exactly 30 migrations");
for (const [file, expected] of Object.entries(historical)) {
  const actual = createHash("sha256")
    .update(readFileSync(path.join(migrationDir, file)))
    .digest("hex");
  check(actual === expected, `historical checksum: ${file}`);
}
const remediation = sorted.filter((f) => !(f in historical));
check(remediation.length > 0, "at least one remediation migration exists");
check(
  remediation.every((f) => f > Object.keys(historical).sort().at(-1)),
  "remediation migrations sort after history",
);

const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);
check(!tracked.some((f) => path.basename(f) === ".env"), "no tracked .env file exists");
const textFiles = tracked.filter((f) => !f.startsWith("public/") && !f.endsWith("bun.lock"));
const corpus = textFiles
  .map((f) => {
    try {
      return `${f}\n${readFileSync(f, "utf8")}`;
    } catch {
      return "";
    }
  })
  .join("\n");
check(!corpus.includes("tlyehajicuotulmfaewi"), "old Supabase project reference is absent");
check(
  !/(canonical|siteUrl|SITE_URL)[^\n]{0,100}https?:\/\/[^\s"']+\.lovable\.app/i.test(corpus),
  "no Lovable preview is an active canonical domain",
);
check(
  !/(?:service[_-]?role|secret|access[_-]?token|password)[A-Z0-9_ -]{0,30}[=:][ \t]*["']?(?!<|process\.|import\.meta|\$\{)[A-Za-z0-9_+\/.=-]{24,}/i.test(
    corpus,
  ),
  "no obvious committed secret value exists",
);
for (const doc of [
  "docs/production-supabase-bootstrap-audit.md",
  "docs/production-migration-execution-plan.md",
  "docs/production-supabase-bootstrap-runbook.md",
]) {
  check(tracked.includes(doc) || readFileSync(doc), `required document exists: ${doc}`);
}
if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}
console.log(
  `Verified ${Object.keys(historical).length} immutable historical and ${remediation.length} remediation migration(s).`,
);

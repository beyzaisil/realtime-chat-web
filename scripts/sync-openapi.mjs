import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  normalizeLineEndings,
  writeLfTextIfChanged,
} from "./text-file.mjs";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const sourcePath = resolve(
  process.argv[2] ??
    resolve(projectRoot, "../realtime-chat-api/docs/openapi.yaml"),
);
const targetPath = resolve(
  process.argv[3] ?? resolve(projectRoot, "contracts/openapi.yaml"),
);

try {
  const sourceText = normalizeLineEndings(
    await readFile(sourcePath, "utf8"),
  );

  if (!/^openapi:\s+3\.1\.\d+\s*$/m.test(sourceText)) {
    throw new Error(`Expected an OpenAPI 3.1 contract at ${sourcePath}`);
  }

  const changed = await writeLfTextIfChanged(targetPath, sourceText);
  console.log(
    changed
      ? `OpenAPI snapshot updated: ${targetPath}`
      : `OpenAPI snapshot is unchanged: ${targetPath}`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

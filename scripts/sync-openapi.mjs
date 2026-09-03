import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import {
  normalizeLineEndings,
  writeLfTextIfChanged,
} from "./text-file.mjs";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const defaultTargetPath = resolve(projectRoot, "contracts/openapi.yaml");
const sourcePath = resolve(
  process.argv[2] ??
    resolve(projectRoot, "../realtime-chat-api/docs/openapi.yaml"),
);
const targetPath = resolve(process.argv[3] ?? defaultTargetPath);
const metadataPath = process.argv[4]
  ? resolve(process.argv[4])
  : process.argv[3]
    ? null
    : resolve(projectRoot, "contracts/openapi-source.json");
const execFileAsync = promisify(execFile);

async function createSourceMetadata(sourceText) {
  const sourceDirectory = dirname(sourcePath);
  const { stdout: rootOutput } = await execFileAsync(
    "git",
    ["-C", sourceDirectory, "rev-parse", "--show-toplevel"],
    { encoding: "utf8" },
  );
  const repositoryRoot = rootOutput.trim();
  const relativeSourcePath = relative(repositoryRoot, sourcePath)
    .split(sep)
    .join("/");

  if (
    !relativeSourcePath ||
    relativeSourcePath === ".." ||
    relativeSourcePath.startsWith("../") ||
    isAbsolute(relativeSourcePath)
  ) {
    throw new Error(`OpenAPI source is outside its Git repository: ${sourcePath}`);
  }

  const { stdout: statusOutput } = await execFileAsync(
    "git",
    [
      "-C",
      repositoryRoot,
      "status",
      "--porcelain",
      "--untracked-files=all",
      "--",
      relativeSourcePath,
    ],
    { encoding: "utf8" },
  );

  if (statusOutput.trim()) {
    throw new Error(
      `Cannot record backend provenance because ${relativeSourcePath} has uncommitted changes`,
    );
  }

  const { stdout: commitOutput } = await execFileAsync(
    "git",
    ["-C", repositoryRoot, "rev-parse", "HEAD"],
    { encoding: "utf8" },
  );

  return {
    schemaVersion: 1,
    source: {
      repository: basename(repositoryRoot),
      commit: commitOutput.trim(),
      path: relativeSourcePath,
    },
    snapshotSha256: createHash("sha256").update(sourceText).digest("hex"),
  };
}

try {
  const sourceText = normalizeLineEndings(
    await readFile(sourcePath, "utf8"),
  );

  if (!/^openapi:\s+3\.1\.\d+\s*$/m.test(sourceText)) {
    throw new Error(`Expected an OpenAPI 3.1 contract at ${sourcePath}`);
  }

  const metadata = metadataPath
    ? await createSourceMetadata(sourceText)
    : null;
  const changed = await writeLfTextIfChanged(targetPath, sourceText);
  const metadataChanged = metadataPath
    ? await writeLfTextIfChanged(
        metadataPath,
        `${JSON.stringify(metadata, null, 2)}\n`,
      )
    : false;

  console.log(
    changed
      ? `OpenAPI snapshot updated: ${targetPath}`
      : `OpenAPI snapshot is unchanged: ${targetPath}`,
  );
  if (metadataPath) {
    console.log(
      metadataChanged
        ? `OpenAPI source metadata updated: ${metadataPath}`
        : `OpenAPI source metadata is unchanged: ${metadataPath}`,
    );
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const sourcePath = resolve(
  process.argv[2] ??
    resolve(projectRoot, "../realtime-chat-api/docs/openapi.yaml"),
);
const targetPath = resolve(
  process.argv[3] ?? resolve(projectRoot, "contracts/openapi.yaml"),
);

try {
  const source = await readFile(sourcePath);
  const sourceText = source.toString("utf8");

  if (!/^openapi:\s+3\.1\.\d+\s*$/m.test(sourceText)) {
    throw new Error(`Expected an OpenAPI 3.1 contract at ${sourcePath}`);
  }

  let current = null;
  try {
    current = await readFile(targetPath);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }

  if (current !== null && current.equals(source)) {
    console.log(`OpenAPI snapshot is unchanged: ${targetPath}`);
  } else {
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, source);
    console.log(`OpenAPI snapshot updated: ${targetPath}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

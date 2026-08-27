import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { renderOpenApiTypes } from "./openapi-codegen.mjs";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const sourcePath = resolve(
  process.argv[2] ?? resolve(projectRoot, "contracts/openapi.yaml"),
);
const generatedPath = resolve(
  process.argv[3] ?? resolve(projectRoot, "lib/api/generated/schema.ts"),
);

try {
  const [expected, actual] = await Promise.all([
    renderOpenApiTypes(sourcePath),
    readFile(generatedPath, "utf8"),
  ]);

  if (actual !== expected) {
    console.error(
      "Generated OpenAPI types are stale. Run npm run contract:generate.",
    );
    process.exitCode = 1;
  } else {
    console.log("Generated OpenAPI types match the contract snapshot.");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

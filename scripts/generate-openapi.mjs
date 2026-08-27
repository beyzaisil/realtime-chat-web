import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  renderOpenApiTypes,
  writeTextIfChanged,
} from "./openapi-codegen.mjs";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const sourcePath = resolve(
  process.argv[2] ?? resolve(projectRoot, "contracts/openapi.yaml"),
);
const targetPath = resolve(
  process.argv[3] ?? resolve(projectRoot, "lib/api/generated/schema.ts"),
);

try {
  const content = await renderOpenApiTypes(sourcePath);
  const changed = await writeTextIfChanged(targetPath, content);
  console.log(
    changed
      ? `Generated OpenAPI types: ${targetPath}`
      : `OpenAPI types are unchanged: ${targetPath}`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import openapiTS, { astToString } from "openapi-typescript";

export const GENERATED_NOTICE = `/**
 * Bu dosya OpenAPI sözleşmesinden otomatik üretilmiştir.
 * Elle düzenlemeyin; npm run contract:generate komutunu kullanın.
 */

`;

export async function renderOpenApiTypes(sourcePath) {
  const sourceUrl = pathToFileURL(resolve(sourcePath));
  const ast = await openapiTS(sourceUrl, { alphabetize: true });

  return `${GENERATED_NOTICE}${astToString(ast)}`;
}

export async function writeTextIfChanged(targetPath, content) {
  let currentContent = null;

  try {
    currentContent = await readFile(targetPath, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }

  if (currentContent === content) {
    return false;
  }

  await mkdir(dirname(targetPath), { recursive: true });
  await writeFile(targetPath, content, "utf8");
  return true;
}

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import openapiTS, { astToString } from "openapi-typescript";

import {
  normalizeLineEndings,
  writeLfTextIfChanged,
} from "./text-file.mjs";

export const GENERATED_NOTICE = `/**
 * Bu dosya OpenAPI sözleşmesinden otomatik üretilmiştir.
 * Elle düzenlemeyin; npm run contract:generate komutunu kullanın.
 */

`;

export async function renderOpenApiTypes(sourcePath) {
  const sourceUrl = pathToFileURL(resolve(sourcePath));
  const ast = await openapiTS(sourceUrl, { alphabetize: true });

  return normalizeLineEndings(`${GENERATED_NOTICE}${astToString(ast)}`);
}

export async function writeTextIfChanged(targetPath, content) {
  return writeLfTextIfChanged(targetPath, content);
}

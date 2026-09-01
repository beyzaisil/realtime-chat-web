import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { parseYaml } from "@redocly/openapi-core";
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

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function resolveLocalReference(document, reference) {
  if (typeof reference !== "string" || !reference.startsWith("#/")) {
    return undefined;
  }

  return reference
    .slice(2)
    .split("/")
    .map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"))
    .reduce(
      (value, part) => (isRecord(value) ? value[part] : undefined),
      document,
    );
}

function getSingleStringValue(schema) {
  if (!isRecord(schema)) {
    return undefined;
  }

  if (typeof schema.const === "string") {
    return schema.const;
  }

  if (
    Array.isArray(schema.enum) &&
    schema.enum.length === 1 &&
    typeof schema.enum[0] === "string"
  ) {
    return schema.enum[0];
  }

  return undefined;
}

function mappingTargetMatchesReference(target, reference) {
  if (target === reference) {
    return true;
  }

  if (typeof target !== "string" || target.startsWith("#")) {
    return false;
  }

  return reference.split("/").at(-1) === target;
}

/**
 * openapi-typescript infers discriminator values from schema names when an
 * explicit mapping is absent. The backend contract keeps the runtime value on
 * each variant's discriminator property as `const` (or a single-value enum),
 * so add an in-memory mapping before code generation. The snapshot itself is
 * intentionally left untouched and remains byte-for-byte synced with backend.
 */
export function addConstDiscriminatorMappings(document) {
  if (!isRecord(document)) {
    throw new TypeError("OpenAPI document must be an object");
  }

  const schemas = document.components?.schemas;
  if (!isRecord(schemas)) {
    return document;
  }

  for (const [unionName, unionSchema] of Object.entries(schemas)) {
    if (
      !isRecord(unionSchema) ||
      !isRecord(unionSchema.discriminator) ||
      typeof unionSchema.discriminator.propertyName !== "string" ||
      !Array.isArray(unionSchema.oneOf)
    ) {
      continue;
    }

    const propertyName = unionSchema.discriminator.propertyName;
    const existingMapping = isRecord(unionSchema.discriminator.mapping)
      ? unionSchema.discriminator.mapping
      : {};
    const mapping = { ...existingMapping };
    let mappingChanged = false;

    for (const variant of unionSchema.oneOf) {
      if (!isRecord(variant) || typeof variant.$ref !== "string") {
        continue;
      }

      const referencedSchema = resolveLocalReference(document, variant.$ref);
      const discriminatorProperty = isRecord(referencedSchema)
        ? referencedSchema.properties?.[propertyName]
        : undefined;
      const runtimeValue = getSingleStringValue(discriminatorProperty);

      if (runtimeValue === undefined) {
        continue;
      }

      const mappedEntries = Object.entries(mapping).filter(([, target]) =>
        mappingTargetMatchesReference(target, variant.$ref),
      );

      if (mappedEntries.some(([value]) => value !== runtimeValue)) {
        throw new Error(
          `Discriminator mapping for ${unionName}.${propertyName} conflicts with variant ${variant.$ref}`,
        );
      }

      const conflictingTarget = mapping[runtimeValue];
      if (
        conflictingTarget !== undefined &&
        !mappingTargetMatchesReference(conflictingTarget, variant.$ref)
      ) {
        throw new Error(
          `Discriminator value ${runtimeValue} maps to multiple variants in ${unionName}`,
        );
      }

      if (mappedEntries.length === 0) {
        mapping[runtimeValue] = variant.$ref;
        mappingChanged = true;
      }
    }

    if (mappingChanged) {
      unionSchema.discriminator.mapping = mapping;
    }
  }

  return document;
}

export async function renderOpenApiTypes(sourcePath) {
  const resolvedSourcePath = resolve(sourcePath);
  const source = await readFile(resolvedSourcePath, "utf8");
  const document = addConstDiscriminatorMappings(
    parseYaml(source, { filename: resolvedSourcePath }),
  );
  const ast = await openapiTS(document, { alphabetize: true });

  return normalizeLineEndings(`${GENERATED_NOTICE}${astToString(ast)}`);
}

export async function writeTextIfChanged(targetPath, content) {
  return writeLfTextIfChanged(targetPath, content);
}

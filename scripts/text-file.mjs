import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export function normalizeLineEndings(content) {
  return content.replace(/\r\n?/g, "\n");
}

export async function writeLfTextIfChanged(targetPath, content) {
  const normalizedContent = normalizeLineEndings(content);
  let currentContent = null;

  try {
    currentContent = await readFile(targetPath, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }

  if (currentContent === normalizedContent) {
    return false;
  }

  await mkdir(dirname(targetPath), { recursive: true });
  await writeFile(targetPath, normalizedContent, "utf8");
  return true;
}

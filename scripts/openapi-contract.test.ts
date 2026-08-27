import {
  mkdtemp,
  readFile,
  rm,
  stat,
  utimes,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");
const contractPath = resolve(projectRoot, "contracts/openapi.yaml");
const generateScript = resolve(projectRoot, "scripts/generate-openapi.mjs");
const checkScript = resolve(projectRoot, "scripts/check-openapi.mjs");
const temporaryDirectories: string[] = [];

async function createTemporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "chat-openapi-"));
  temporaryDirectories.push(directory);
  return directory;
}

function runScript(script: string, ...arguments_: string[]) {
  return spawnSync(process.execPath, [script, ...arguments_], {
    cwd: projectRoot,
    encoding: "utf8",
  });
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("OpenAPI contract tooling", () => {
  it("generates TypeScript types from the contract snapshot", async () => {
    const directory = await createTemporaryDirectory();
    const generatedPath = join(directory, "schema.ts");

    const result = runScript(generateScript, contractPath, generatedPath);
    const generated = await readFile(generatedPath, "utf8");

    expect(result.status).toBe(0);
    expect(generated).toContain("Elle düzenlemeyin");
    expect(generated).toContain("export interface paths");
    expect(generated).toContain("export interface components");
  });

  it("does not rewrite an unchanged generated file", async () => {
    const directory = await createTemporaryDirectory();
    const generatedPath = join(directory, "schema.ts");
    const firstResult = runScript(generateScript, contractPath, generatedPath);
    expect(firstResult.status).toBe(0);

    const fixedTime = new Date("2020-01-01T00:00:00.000Z");
    await utimes(generatedPath, fixedTime, fixedTime);
    const before = await stat(generatedPath);

    const secondResult = runScript(generateScript, contractPath, generatedPath);
    const after = await stat(generatedPath);

    expect(secondResult.status).toBe(0);
    expect(secondResult.stdout).toContain("unchanged");
    expect(after.mtimeMs).toBe(before.mtimeMs);
  });

  it("fails contract:check when the contract changes without regeneration", async () => {
    const directory = await createTemporaryDirectory();
    const generatedPath = join(directory, "schema.ts");
    const changedContractPath = join(directory, "openapi.yaml");
    const initialResult = runScript(generateScript, contractPath, generatedPath);
    expect(initialResult.status).toBe(0);

    const originalContract = await readFile(contractPath, "utf8");
    const driftedContract = `${originalContract}
    ContractDriftProbe:
      type: object
      additionalProperties: false
      required: [value]
      properties:
        value:
          type: string
`;
    await writeFile(changedContractPath, driftedContract, "utf8");

    const checkResult = runScript(
      checkScript,
      changedContractPath,
      generatedPath,
    );

    expect(checkResult.status).toBe(1);
    expect(checkResult.stderr).toContain("Generated OpenAPI types are stale");
  });
});

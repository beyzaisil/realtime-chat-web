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
const syncScript = resolve(projectRoot, "scripts/sync-openapi.mjs");
const generateScript = resolve(projectRoot, "scripts/generate-openapi.mjs");
const checkScript = resolve(projectRoot, "scripts/check-openapi.mjs");
const temporaryDirectories: string[] = [];

const backendConversationDiscriminators = {
  DirectConversation: "DIRECT",
  GroupConversation: "GROUP",
  ListedDirectConversation: "DIRECT",
  ListedGroupConversation: "GROUP",
} as const;

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

function getGeneratedSchema(generated: string, schemaName: string): string {
  const startMarker = `        ${schemaName}: {`;
  const start = generated.indexOf(startMarker);
  if (start === -1) {
    throw new Error(`Generated schema ${schemaName} was not found`);
  }

  const end = generated.indexOf("\n        };", start);
  if (end === -1) {
    throw new Error(`Generated schema ${schemaName} is incomplete`);
  }

  return generated.slice(start, end);
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("OpenAPI contract tooling", () => {
  it("normalizes a CRLF contract snapshot to LF and keeps it unchanged", async () => {
    const directory = await createTemporaryDirectory();
    const sourcePath = join(directory, "source-openapi.yaml");
    const snapshotPath = join(directory, "snapshot-openapi.yaml");
    const contract = await readFile(contractPath, "utf8");
    const crlfContract = contract.replace(/\r?\n/g, "\r\n");
    await writeFile(sourcePath, crlfContract, "utf8");

    const firstResult = runScript(syncScript, sourcePath, snapshotPath);
    const firstSnapshot = await readFile(snapshotPath, "utf8");
    expect(firstResult.status).toBe(0);
    expect(firstSnapshot).not.toContain("\r");

    const fixedTime = new Date("2020-01-01T00:00:00.000Z");
    await utimes(snapshotPath, fixedTime, fixedTime);
    const before = await stat(snapshotPath);
    const secondResult = runScript(syncScript, sourcePath, snapshotPath);
    const after = await stat(snapshotPath);

    expect(secondResult.status).toBe(0);
    expect(secondResult.stdout).toContain("unchanged");
    expect(after.mtimeMs).toBe(before.mtimeMs);
  });

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

  it("keeps generated conversation discriminators aligned with backend responses", async () => {
    const directory = await createTemporaryDirectory();
    const generatedPath = join(directory, "schema.ts");

    const result = runScript(generateScript, contractPath, generatedPath);
    const generated = await readFile(generatedPath, "utf8");

    expect(result.status).toBe(0);
    for (const [schemaName, runtimeValue] of Object.entries(
      backendConversationDiscriminators,
    )) {
      const schema = getGeneratedSchema(generated, schemaName);
      expect(schema).toContain(`type: "${runtimeValue}";`);
      expect(schema).not.toContain(`type: "${schemaName}";`);
    }

    const createMessageRequest = getGeneratedSchema(
      generated,
      "CreateMessageRequest",
    );
    expect(createMessageRequest).toContain('type: "text";');
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

  it("accepts CRLF generated types when their content matches", async () => {
    const directory = await createTemporaryDirectory();
    const generatedPath = join(directory, "schema.ts");
    const generateResult = runScript(
      generateScript,
      contractPath,
      generatedPath,
    );
    expect(generateResult.status).toBe(0);

    const generated = await readFile(generatedPath, "utf8");
    await writeFile(
      generatedPath,
      generated.replace(/\r?\n/g, "\r\n"),
      "utf8",
    );

    const checkResult = runScript(checkScript, contractPath, generatedPath);

    expect(checkResult.status).toBe(0);
    expect(checkResult.stdout).toContain(
      "Generated OpenAPI types match the contract snapshot",
    );
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

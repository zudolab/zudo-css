import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execSync } from "node:child_process";
import { mkdtempSync, readFileSync, existsSync, rmSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const SCRIPT_PATH = resolve(__dirname, "../setup-doc-skill.sh");
const PROJECT_ROOT = resolve(__dirname, "../..");
const TEST_SKILL_NAME = "test-wisdom";

/**
 * Run setup-doc-skill.sh in the real project directory with a custom
 * HOME so the global symlink goes to a temp directory instead of ~/.claude/skills/.
 * The skill name is passed via stdin using execSync's input option.
 */
function runScript(skillName: string, fakeHome: string): string {
  return execSync(
    `bash "${SCRIPT_PATH}"`,
    {
      cwd: PROJECT_ROOT,
      encoding: "utf-8",
      input: skillName + "\n",
      timeout: 30_000,
      env: {
        ...process.env,
        HOME: fakeHome,
      },
    },
  );
}

describe("setup-doc-skill.sh", () => {
  let fakeHome: string;

  beforeEach(() => {
    fakeHome = mkdtempSync(join(tmpdir(), "zudo-doc-test-"));
  });

  afterEach(() => {
    const skillDir = join(PROJECT_ROOT, ".claude", "skills", TEST_SKILL_NAME);
    if (existsSync(skillDir)) {
      rmSync(skillDir, { recursive: true });
    }
    if (existsSync(fakeHome)) {
      rmSync(fakeHome, { recursive: true });
    }
  });

  it("creates SKILL.md with correct frontmatter", () => {
    runScript(TEST_SKILL_NAME, fakeHome);

    const skillMd = readFileSync(
      join(PROJECT_ROOT, ".claude", "skills", TEST_SKILL_NAME, "SKILL.md"),
      "utf-8",
    );

    expect(skillMd).toContain("name: test-wisdom");
    expect(skillMd).toContain("user-invocable: true");
    expect(skillMd).toContain("zudo-doc");
  });

  it("creates docs symlink pointing to src/content/docs", () => {
    runScript(TEST_SKILL_NAME, fakeHome);

    const docsLink = join(PROJECT_ROOT, ".claude", "skills", TEST_SKILL_NAME, "docs");
    expect(existsSync(docsLink)).toBe(true);

    const target = realpathSync(docsLink);
    expect(target).toBe(join(PROJECT_ROOT, "src", "content", "docs"));
  });

  it("creates docs-ja symlink when Japanese docs exist", () => {
    runScript(TEST_SKILL_NAME, fakeHome);

    const docsJaLink = join(PROJECT_ROOT, ".claude", "skills", TEST_SKILL_NAME, "docs-ja");
    expect(existsSync(docsJaLink)).toBe(true);

    const target = realpathSync(docsJaLink);
    expect(target).toBe(join(PROJECT_ROOT, "src", "content", "docs-ja"));
  });

  it("creates global symlink in HOME/.claude/skills/ pointing to project skill", () => {
    runScript(TEST_SKILL_NAME, fakeHome);

    const globalLink = join(fakeHome, ".claude", "skills", TEST_SKILL_NAME);
    expect(existsSync(globalLink)).toBe(true);

    const target = realpathSync(globalLink);
    const projectSkill = join(PROJECT_ROOT, ".claude", "skills", TEST_SKILL_NAME);
    expect(target).toBe(realpathSync(projectSkill));
  });

  it("includes doc category tree in SKILL.md", () => {
    runScript(TEST_SKILL_NAME, fakeHome);

    const skillMd = readFileSync(
      join(PROJECT_ROOT, ".claude", "skills", TEST_SKILL_NAME, "SKILL.md"),
      "utf-8",
    );

    expect(skillMd).toContain("- getting-started/");
    expect(skillMd).toContain("- guides/");
    expect(skillMd).toContain("- reference/");
    expect(skillMd).toContain("- components/");
  });

  it("includes Japanese documentation section", () => {
    runScript(TEST_SKILL_NAME, fakeHome);

    const skillMd = readFileSync(
      join(PROJECT_ROOT, ".claude", "skills", TEST_SKILL_NAME, "SKILL.md"),
      "utf-8",
    );

    expect(skillMd).toContain("Japanese Documentation");
    expect(skillMd).toContain("docs-ja");
  });
});

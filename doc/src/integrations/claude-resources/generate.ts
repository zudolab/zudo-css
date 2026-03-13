import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { escapeForMdx } from "./escape-for-mdx";

export interface ClaudeResourcesConfig {
  claudeDir: string;
  projectRoot?: string;
  docsDir: string;
}

interface ClaudeMdItem {
  displayPath: string;
  slug: string;
  relPath: string;
}

interface CommandItem {
  name: string;
  description: string;
}

interface SkillReference {
  name: string;
  title: string;
  content: string;
}

interface SkillItem {
  name: string;
  dir: string;
  description: string;
  references: SkillReference[];
}

interface AgentItem {
  name: string;
  file: string;
  description: string;
  model: string;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function cleanDir(dir: string) {
  if (!fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true });
}

function parseFrontmatter(content: string) {
  try {
    return matter(content);
  } catch {
    return null;
  }
}

function escapeTitle(s: string): string {
  return s.replace(/"/g, '\\"');
}

// ---------------------------------------------------------------------------
// CLAUDE.md discovery
// ---------------------------------------------------------------------------

function findClaudeMdFiles(dir: string, excludeDirs: string[]): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  for (const item of fs.readdirSync(dir)) {
    if (item === "node_modules") continue;
    const itemPath = path.join(dir, item);
    if (excludeDirs.some((d) => itemPath.startsWith(d))) continue;

    let stat: fs.Stats;
    try {
      stat = fs.statSync(itemPath);
    } catch {
      continue; // broken symlinks
    }
    if (stat.isDirectory()) {
      results.push(...findClaudeMdFiles(itemPath, excludeDirs));
    } else if (item === "CLAUDE.md") {
      results.push(itemPath);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// CLAUDE.md generation
// ---------------------------------------------------------------------------

function generateClaudemdDocs(
  config: ClaudeResourcesConfig,
): ClaudeMdItem[] {
  const projectRoot = config.projectRoot ?? path.dirname(config.claudeDir);
  const outputDir = path.join(config.docsDir, "claude-md");

  cleanDir(outputDir);

  const excludeDirs = [
    path.join(projectRoot, ".git"),
    path.join(projectRoot, "node_modules"),
    path.join(projectRoot, "worktrees"),
    path.join(config.docsDir),
  ];

  const files = findClaudeMdFiles(projectRoot, excludeDirs);
  if (files.length === 0) return [];

  ensureDir(outputDir);
  const items: ClaudeMdItem[] = [];

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, "utf8");
    const relPath = path.relative(projectRoot, filePath);
    const displayPath = `/${relPath}`;
    const dirPart = path.dirname(relPath);
    const slug = dirPart === "." ? "root" : dirPart.replace(/\//g, "--");

    items.push({ displayPath, slug, relPath });

    const pos = items.length + 1;
    const mdx = `---
title: "${escapeTitle(displayPath)}"
description: "CLAUDE.md at ${escapeTitle(displayPath)}"
sidebar_position: ${pos}
sidebar_label: "${escapeTitle(relPath)}"
---

**Path:** \`${relPath}\`

${escapeForMdx(content.trim())}
`;
    fs.writeFileSync(path.join(outputDir, `${slug}.mdx`), mdx);
  }

  // Sort: root first, then alphabetically
  items.sort((a, b) => {
    if (a.slug === "root") return -1;
    if (b.slug === "root") return 1;
    return a.displayPath.localeCompare(b.displayPath);
  });

  // Index page
  const list = items
    .map((item) => `- [\`${item.displayPath}\`](./${item.slug}/)`)
    .join("\n");

  const index = `---
title: "CLAUDE.md"
description: "CLAUDE.md files provide project-specific instructions to Claude Code."
sidebar_position: 900
---

CLAUDE.md files found in this project.

## Files (${items.length})

${list}
`;
  fs.writeFileSync(path.join(outputDir, "index.mdx"), index);
  return items;
}

// ---------------------------------------------------------------------------
// Commands generation
// ---------------------------------------------------------------------------

function generateCommandsDocs(config: ClaudeResourcesConfig): CommandItem[] {
  const commandsDir = path.join(config.claudeDir, "commands");
  const outputDir = path.join(config.docsDir, "claude-commands");

  cleanDir(outputDir);

  if (!fs.existsSync(commandsDir)) return [];

  const files = fs.readdirSync(commandsDir).filter((f) => f.endsWith(".md"));
  if (files.length === 0) return [];

  ensureDir(outputDir);
  const items: CommandItem[] = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(commandsDir, file), "utf8");
    const parsed = parseFrontmatter(content);
    if (!parsed) continue;

    const name = file.replace(/\.md$/, "");
    const description = (parsed.data.description as string) || "";

    items.push({ name, description });

    const mdx = `---
title: "${escapeTitle(name)}"
description: "${escapeTitle(description)}"
sidebar_label: "${escapeTitle(name)}"
---

${escapeForMdx(parsed.content.trim())}
`;
    fs.writeFileSync(path.join(outputDir, `${name}.mdx`), mdx);
  }

  items.sort((a, b) => a.name.localeCompare(b.name));

  const list = items
    .map((cmd) => `- [\`/${cmd.name}\`](./${cmd.name}/) — ${cmd.description}`)
    .join("\n");

  const index = `---
title: "Commands"
description: "Claude Code custom slash commands reference."
sidebar_position: 901
---

Custom slash commands reference.

## Available Commands (${items.length})

${list}
`;
  fs.writeFileSync(path.join(outputDir, "index.mdx"), index);
  return items;
}

// ---------------------------------------------------------------------------
// Skills generation
// ---------------------------------------------------------------------------

function getSkillReferences(
  skillsDir: string,
  skillDir: string,
): SkillReference[] {
  const refsDir = path.join(skillsDir, skillDir, "references");
  if (!fs.existsSync(refsDir)) return [];

  return fs
    .readdirSync(refsDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const content = fs.readFileSync(path.join(refsDir, f), "utf8");
      const name = f.replace(/\.md$/, "");
      const h1Match = content.match(/^#\s+(.+)$/m);
      const title = h1Match ? h1Match[1] : name;
      return { name, title, content };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function generateSkillsDocs(config: ClaudeResourcesConfig): SkillItem[] {
  const skillsDir = path.join(config.claudeDir, "skills");
  const outputDir = path.join(config.docsDir, "claude-skills");

  cleanDir(outputDir);

  if (!fs.existsSync(skillsDir)) return [];

  const dirs = fs.readdirSync(skillsDir).filter((d) => {
    const skillPath = path.join(skillsDir, d);
    return (
      fs.statSync(skillPath).isDirectory() &&
      fs.existsSync(path.join(skillPath, "SKILL.md"))
    );
  });

  if (dirs.length === 0) return [];

  ensureDir(outputDir);
  const items: SkillItem[] = [];

  for (const dir of dirs) {
    const content = fs.readFileSync(
      path.join(skillsDir, dir, "SKILL.md"),
      "utf8",
    );
    const parsed = parseFrontmatter(content);
    if (!parsed) continue;

    const name = (parsed.data.name as string) || dir;
    const description = (parsed.data.description as string) || "";
    const references = getSkillReferences(skillsDir, dir);

    items.push({ name, dir, description, references });

    const hasScripts = fs.existsSync(path.join(skillsDir, dir, "scripts"));
    const hasAssets = fs.existsSync(path.join(skillsDir, dir, "assets"));
    const resourceList = [
      references.length > 0 && "references",
      hasScripts && "scripts",
      hasAssets && "assets",
    ].filter(Boolean);

    const resourcesNote =
      resourceList.length > 0
        ? `> Bundled resources: ${resourceList.join(", ")}\n`
        : "";

    let referencesSection = "";
    if (references.length > 0) {
      const refLinks = references
        .map((ref) => `- [${ref.title}](./${dir}--${ref.name}/)`)
        .join("\n");
      referencesSection = `\n\n## References\n\n${refLinks}\n`;
    }

    const shortDesc = description.length > 200
      ? description.substring(0, 200) + "..."
      : description;

    const mdx = `---
title: "${escapeTitle(name)}"
description: "${escapeTitle(shortDesc)}"
sidebar_label: "${escapeTitle(name)}"
---

${resourcesNote}

${escapeForMdx(parsed.content.trim())}
${referencesSection}`;

    fs.writeFileSync(path.join(outputDir, `${dir}.mdx`), mdx);

    // Generate reference pages
    for (const ref of references) {
      const refMdx = `---
title: "${escapeTitle(ref.title)}"
sidebar_label: "${escapeTitle(ref.title)}"
---

**Skill:** [${name}](./${dir}/)

---

${escapeForMdx(ref.content.trim())}
`;
      fs.writeFileSync(
        path.join(outputDir, `${dir}--${ref.name}.mdx`),
        refMdx,
      );
    }
  }

  items.sort((a, b) => a.name.localeCompare(b.name));

  const list = items
    .map((skill) => {
      const shortDesc =
        skill.description.length > 100
          ? skill.description.substring(0, 100) + "..."
          : skill.description;
      const refCount =
        skill.references.length > 0
          ? ` (${skill.references.length} refs)`
          : "";
      return `- [\`${skill.name}\`](./${skill.dir}/)${refCount} — ${shortDesc}`;
    })
    .join("\n");

  const index = `---
title: "Skills"
description: "Claude Code skills reference."
sidebar_position: 902
---

Skills reference.

## Available Skills (${items.length})

${list}
`;
  fs.writeFileSync(path.join(outputDir, "index.mdx"), index);
  return items;
}

// ---------------------------------------------------------------------------
// Agents generation
// ---------------------------------------------------------------------------

function generateAgentsDocs(config: ClaudeResourcesConfig): AgentItem[] {
  const agentsDir = path.join(config.claudeDir, "agents");
  const outputDir = path.join(config.docsDir, "claude-agents");

  cleanDir(outputDir);

  if (!fs.existsSync(agentsDir)) return [];

  const files = fs.readdirSync(agentsDir).filter((f) => f.endsWith(".md"));
  if (files.length === 0) return [];

  ensureDir(outputDir);
  const items: AgentItem[] = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(agentsDir, file), "utf8");
    const parsed = parseFrontmatter(content);
    if (!parsed) continue;

    const name = (parsed.data.name as string) || file.replace(/\.md$/, "");
    const description = (parsed.data.description as string) || "";
    const model = (parsed.data.model as string) || "";
    const fileSlug = file.replace(/\.md$/, "");

    items.push({ name, file: fileSlug, description, model });

    const modelBadge = model ? `**Model:** \`${model}\`\n` : "";

    const mdx = `---
title: "${escapeTitle(name)}"
description: "${escapeTitle(description)}"
sidebar_label: "${escapeTitle(name)}"
---

${modelBadge}
${escapeForMdx(parsed.content.trim())}
`;
    fs.writeFileSync(path.join(outputDir, `${fileSlug}.mdx`), mdx);
  }

  items.sort((a, b) => a.name.localeCompare(b.name));

  const list = items
    .map((agent) => {
      const modelInfo = agent.model ? ` (${agent.model})` : "";
      return `- [\`${agent.name}\`](./${agent.file}/)${modelInfo} — ${agent.description}`;
    })
    .join("\n");

  const index = `---
title: "Agents"
description: "Claude Code subagents reference."
sidebar_position: 903
---

Subagents reference.

## Available Agents (${items.length})

${list}
`;
  fs.writeFileSync(path.join(outputDir, "index.mdx"), index);
  return items;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function generateOverviewIndex(
  config: ClaudeResourcesConfig,
  counts: { claudemd: number; commands: number; skills: number; agents: number },
) {
  const outputDir = path.join(config.docsDir, "claude");
  cleanDir(outputDir);
  ensureDir(outputDir);

  const sections = [
    counts.claudemd > 0 &&
      `- **[CLAUDE.md](../claude-md/)** (${counts.claudemd}) — Project-specific instructions`,
    counts.commands > 0 &&
      `- **[Commands](../claude-commands/)** (${counts.commands}) — Custom slash commands`,
    counts.skills > 0 &&
      `- **[Skills](../claude-skills/)** (${counts.skills}) — Skill packages`,
    counts.agents > 0 &&
      `- **[Agents](../claude-agents/)** (${counts.agents}) — Custom subagents`,
  ]
    .filter(Boolean)
    .join("\n");

  const index = `---
title: "Claude"
description: "Claude Code configuration reference."
sidebar_position: 899
---

Claude Code configuration reference.

## Contents

${sections}
`;
  fs.writeFileSync(path.join(outputDir, "index.mdx"), index);
}

export function generateClaudeResourcesDocs(config: ClaudeResourcesConfig) {
  const claudemds = generateClaudemdDocs(config);
  const commands = generateCommandsDocs(config);
  const skills = generateSkillsDocs(config);
  const agents = generateAgentsDocs(config);

  const counts = {
    claudemd: claudemds.length,
    commands: commands.length,
    skills: skills.length,
    agents: agents.length,
  };

  generateOverviewIndex(config, counts);

  return counts;
}

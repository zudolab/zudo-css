import type { AstroIntegration } from "astro";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { settings } from "../config/settings";
import { collectContentFiles, getDocHistory } from "../utils/doc-history";

const DOC_HISTORY_SERVER_PORT = 4322;

/** Build list of [localeKey | null, absoluteDir] pairs from settings */
function getContentDirEntries(): Array<[string | null, string]> {
  const entries: Array<[string | null, string]> = [
    [null, resolve(settings.docsDir)],
  ];
  if (settings.locales) {
    for (const [key, locale] of Object.entries(settings.locales)) {
      entries.push([key, resolve(locale.dir)]);
    }
  }
  return entries;
}

export function docHistoryIntegration(): AstroIntegration {
  return {
    name: "doc-history",
    hooks: {
      "astro:config:setup": ({ updateConfig, command, logger }) => {
        if (command !== "dev") return;

        logger.info(
          `Proxying /doc-history/* to localhost:${DOC_HISTORY_SERVER_PORT}`,
        );

        updateConfig({
          vite: {
            plugins: [
              {
                name: "doc-history-dev-proxy",
                configureServer(server) {
                  server.middlewares.use((req, res, next) => {
                    const url = req.url ?? "";
                    // Match /doc-history/*.json requests (with optional base path prefix)
                    if (!url.includes("/doc-history/")) {
                      next();
                      return;
                    }

                    // Extract the path starting from /doc-history/
                    const idx = url.indexOf("/doc-history/");
                    const proxyPath = url.slice(idx);

                    const proxyUrl = `http://localhost:${DOC_HISTORY_SERVER_PORT}${proxyPath}`;

                    // Proxy the request to the standalone doc-history server
                    fetch(proxyUrl)
                      .then(async (upstream) => {
                        res.statusCode = upstream.status;
                        res.setHeader(
                          "Content-Type",
                          upstream.headers.get("content-type") ??
                            "application/json",
                        );
                        const body = await upstream.text();
                        res.end(body);
                      })
                      .catch((err) => {
                        const msg =
                          err instanceof Error ? err.message : String(err);
                        logger.warn(
                          `Doc history proxy failed: ${msg}. Is the doc-history server running on port ${DOC_HISTORY_SERVER_PORT}?`,
                        );
                        res.statusCode = 502;
                        res.setHeader("Content-Type", "application/json");
                        res.end(
                          JSON.stringify({
                            error: `Doc history server unavailable (port ${DOC_HISTORY_SERVER_PORT})`,
                          }),
                        );
                      });
                  });
                },
              },
            ],
          },
        });
      },

      "astro:build:done": async ({ dir, logger }) => {
        // CI uses SKIP_DOC_HISTORY=1 when the separate build-history job
        // handles generation via @zudo-doc/doc-history-server CLI.
        if (process.env.SKIP_DOC_HISTORY === "1") {
          logger.info("Skipping doc history generation (SKIP_DOC_HISTORY=1)");
          return;
        }

        // Fallback: generate inline (for local builds and E2E tests)
        const outDir = fileURLToPath(dir);
        const historyDir = join(outDir, "doc-history");
        mkdirSync(historyDir, { recursive: true });

        const dirEntries = getContentDirEntries();
        let totalFiles = 0;

        for (const [localeKey, contentDir] of dirEntries) {
          const files = collectContentFiles(contentDir);
          for (const { filePath, slug } of files) {
            try {
              const history = getDocHistory(filePath, slug);
              const prefixedSlug = localeKey ? `${localeKey}/${slug}` : slug;
              const jsonPath = join(historyDir, `${prefixedSlug}.json`);
              mkdirSync(dirname(jsonPath), { recursive: true });
              writeFileSync(jsonPath, JSON.stringify(history));
              totalFiles++;
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              logger.warn(`Skipped history for ${slug}: ${msg}`);
            }
          }
        }

        logger.info(
          `Generated doc history for ${totalFiles} files in doc-history/`,
        );
      },
    },
  };
}

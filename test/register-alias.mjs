import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * Resolves the `@/` alias the application is written with, so a test imports
 * the very module a route imports rather than a copy of it reached by a
 * relative path. Node has no tsconfig path mapping of its own; this is the
 * whole of what it would need.
 */
const root = pathToFileURL(`${process.cwd()}/`);

const EXTENSIONS = ["", ".ts", ".tsx", ".mts", "/index.ts"];

registerHooks({
  resolve(specifier, context, next) {
    if (!specifier.startsWith("@/")) return next(specifier, context);

    const base = new URL(specifier.slice(2), root);

    for (const extension of EXTENSIONS) {
      const candidate = new URL(base.href + extension);
      if (existsSync(fileURLToPath(candidate))) return next(candidate.href, context);
    }

    return next(base.href, context);
  },
});

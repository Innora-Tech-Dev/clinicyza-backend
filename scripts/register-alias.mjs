/**
 * Lets plain Node processes (worker, realtime server, tests) load the same source
 * files Next.js uses: resolves the "@/..." alias from jsconfig.json and
 * extension-less imports ("./ApiError" → "./ApiError.js").
 * Also loads .env.local when it exists.
 *
 *   node --import ./scripts/register-alias.mjs scripts/worker.mjs
 *
 * Requires Node 22.15+ (module.registerHooks).
 */
import { existsSync, statSync } from "node:fs";
import { registerHooks } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = new URL("../", import.meta.url);

const isFile = (url) => {
  try {
    return statSync(fileURLToPath(url)).isFile();
  } catch {
    return false;
  }
};

const isOwnSource = (url) => url?.startsWith(ROOT.href) && !url.includes("/node_modules/");
const isBare = (s) => !s.startsWith(".") && !s.startsWith("/") && !s.includes(":") && !s.startsWith("@/");

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (!isOwnSource(context.parentURL)) return nextResolve(specifier, context);

    // "next/server" etc. — packages without an exports map need the extension under ESM
    if (isBare(specifier)) {
      try {
        return nextResolve(specifier, context);
      } catch (error) {
        if (error?.code !== "ERR_MODULE_NOT_FOUND" || specifier.endsWith(".js")) throw error;
        return nextResolve(`${specifier}.js`, context);
      }
    }

    let target = null;
    if (specifier.startsWith("@/")) target = new URL(specifier.slice(2), ROOT);
    else if (specifier.startsWith("./") || specifier.startsWith("../")) target = new URL(specifier, context.parentURL);
    if (!target) return nextResolve(specifier, context);

    if (isFile(target)) return nextResolve(target.href, context);
    for (const candidate of [`${target.href}.js`, `${target.href}/index.js`]) {
      if (isFile(new URL(candidate))) return nextResolve(candidate, context);
    }
    return nextResolve(specifier, context);
  },
});

const envFile = fileURLToPath(new URL(".env.local", ROOT));
if (existsSync(envFile)) process.loadEnvFile(envFile);

/**
 * One command for local development.
 *   npm run dev        → API (:8000) + worker + realtime (:8001) + Mailpit (if installed)
 *   npm run dev:all    → the above + ../clinicyza-web (:3001) + ../clinicyza-portals (:3002)
 * Ctrl+C stops everything.
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const SIBLINGS = fileURLToPath(new URL("../../", import.meta.url));
const withAll = process.argv.includes("--all");

const COLORS = [36, 35, 33, 32, 34, 31];
const env = { ...process.env, NODE_ENV: "development", FORCE_COLOR: "1" };
const node = (script) => ["node", ["--watch-path=lib", "--watch-path=models", "--watch-path=config", "--import", "./scripts/register-alias.mjs", script]];

const procs = [
  { name: "api", cmd: "npx", args: ["next", "dev", "-p", "8000"], cwd: ROOT },
  { name: "worker", cmd: node("scripts/worker.mjs")[0], args: node("scripts/worker.mjs")[1], cwd: ROOT },
  { name: "realtime", cmd: node("scripts/realtime.mjs")[0], args: node("scripts/realtime.mjs")[1], cwd: ROOT },
];

if (spawnSync("which", ["mailpit"]).status === 0) {
  procs.push({ name: "mail", cmd: "mailpit", args: ["--smtp", "127.0.0.1:1025", "--listen", "127.0.0.1:8025"], cwd: ROOT });
} else {
  console.log("ℹ Mailpit not installed — emails print to the console. Install: brew install mailpit");
}

if (withAll) {
  for (const [name, dir] of [["web", "clinicyza-web"], ["portals", "clinicyza-portals"]]) {
    const cwd = `${SIBLINGS}${dir}`;
    if (existsSync(cwd)) procs.push({ name, cmd: "npm", args: ["run", "dev"], cwd });
    else console.log(`ℹ ${dir} not found next to clinicyza-server — skipped`);
  }
}

const width = Math.max(...procs.map((p) => p.name.length));
const children = procs.map((p, i) => {
  const label = `\x1b[${COLORS[i % COLORS.length]}m${p.name.padEnd(width)} │\x1b[0m`;
  const child = spawn(p.cmd, p.args, { cwd: p.cwd, env: p.name === "web" || p.name === "portals" ? process.env : env });
  const pipe = (stream, out) => {
    let buffer = "";
    stream.on("data", (chunk) => {
      buffer += chunk;
      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (const line of lines) out.write(`${label} ${line}\n`);
    });
  };
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  child.on("exit", (code) => console.log(`${label} exited (${code ?? "signal"})`));
  return child;
});

let shuttingDown = false;
const shutdown = () => {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) child.kill("SIGTERM");
  setTimeout(() => process.exit(0), 3000).unref();
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

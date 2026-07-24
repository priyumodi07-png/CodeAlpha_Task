import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("[Node.js Server] Launching Node.js Express Backend...");

const child = spawn("npx", ["tsx", path.join(__dirname, "server.ts")], {
  stdio: "inherit",
  env: { ...process.env },
});

child.on("error", (err) => {
  console.error("[Node.js Server] Execution error:", err);
});

child.on("exit", (code) => {
  if (code !== 0) {
    console.warn(`[Node.js Server] Stopped with exit code ${code}`);
  }
});

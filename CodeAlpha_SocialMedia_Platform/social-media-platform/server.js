/**
 * Node.js entry point for Verve Social Platform.
 * Executable directly via `node server.js` or `npm run start:node`.
 */
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🚀 Launching Verve Node.js Express & Vite Server...");

const serverProcess = spawn("npx", ["tsx", path.join(__dirname, "server.ts")], {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || "development"
  }
});

serverProcess.on("error", (err) => {
  console.error("❌ Node.js server error:", err);
});

serverProcess.on("exit", (code) => {
  if (code !== 0 && code !== null) {
    console.error(`⚠️ Node.js server exited with code ${code}`);
  }
});

import { chmodSync, existsSync } from "node:fs";

const file = "build/index.js";

if (existsSync(file)) {
  chmodSync(file, 0o755);
}

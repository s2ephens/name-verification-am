import fs from "node:fs";

export const LATEST_TARGET_PATH = process.env.AM_LATEST_TARGET_PATH || ".am_latest_target.json";

export function readLatestTarget(path = LATEST_TARGET_PATH) {
  if (!fs.existsSync(path)) return null;
  try {
    const raw = fs.readFileSync(path, "utf8");
    const data = JSON.parse(raw);
    const name = data?.latest_target_name;
    return typeof name === "string" && name.trim() ? name : null;
  } catch {
    return null;
  }
}

export function writeLatestTarget(name, path = LATEST_TARGET_PATH) {
  const payload = { latest_target_name: String(name) };
  fs.writeFileSync(path, JSON.stringify(payload, null, 2), "utf8");
}




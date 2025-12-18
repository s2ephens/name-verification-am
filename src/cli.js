import { generateTargetName } from "./generator.js";
import { readLatestTarget, writeLatestTarget } from "./storage.js";
import { verifyCandidate } from "./verifier.js";

function usage() {
  // eslint-disable-next-line no-console
  console.log(
    [
      "Usage:",
      "  node src/cli.js generate <prompt>",
      "  node src/cli.js verify <candidate>",
      "",
      "Notes:",
      "  - Latest target is stored in .am_latest_target.json (override via AM_LATEST_TARGET_PATH).",
    ].join("\n"),
  );
}

function main(argv) {
  const [cmd, ...rest] = argv;
  if (!cmd) {
    usage();
    return 2;
  }

  if (cmd === "generate") {
    const prompt = rest.join(" ").trim();
    if (!prompt) {
      usage();
      return 2;
    }
    const name = generateTargetName(prompt);
    writeLatestTarget(name);
    // eslint-disable-next-line no-console
    console.log(name);
    return 0;
  }

  if (cmd === "verify") {
    const candidate = rest.join(" ").trim();
    if (!candidate) {
      usage();
      return 2;
    }
    const latest = readLatestTarget();
    const res = verifyCandidate(candidate, latest);
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ match: res.match, confidence: res.confidence, reason: res.reason }));
    return latest ? 0 : 2;
  }

  usage();
  return 2;
}

process.exitCode = main(process.argv.slice(2));




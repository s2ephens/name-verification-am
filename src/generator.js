import crypto from "node:crypto";

function mulberry32(seed) {
  let t = seed >>> 0;
  return function rand() {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromPrompt(prompt) {
  const h = crypto.createHash("sha256").update(String(prompt), "utf8").digest();
  // use first 4 bytes for a 32-bit seed
  return h.readUInt32BE(0);
}

function choice(rand, arr) {
  return arr[Math.floor(rand() * arr.length)];
}

export function generateTargetName(prompt) {
  const p = String(prompt);
  const pl = p.toLowerCase();
  const wantsArabic = ["arab", "arabic", "al ", " ibn", "bint", "abdul", "muhammad", "mohammed"].some((k) =>
    pl.includes(k),
  );
  const wantsHyphen = p.includes("-") || pl.includes("hyphen");

  const rand = mulberry32(seedFromPrompt(p));

  let name = "";
  if (wantsArabic) {
    const given = choice(rand, ["Omar", "Yusuf", "Abdul Rahman", "Ahmed", "Fatima", "Zahra", "Muhammad", "Mohammed"]);
    const parts = [given];
    if (pl.includes("ibn") || rand() < 0.6) parts.push("ibn", choice(rand, ["Saleh", "Omar", "Ali", "Al Khattab"]));
    if (pl.includes("al") || rand() < 0.7) {
      const family = choice(rand, ["Hassan", "Saud", "Qasim", "Rashid", "Hilal", "Fayed"]);
      if (wantsHyphen || rand() < 0.4) parts.push(`Al-${family}`);
      else parts.push("Al", family);
    }
    name = parts.join(" ");
  } else {
    const first = choice(rand, ["Tyler", "Sarah", "Steven", "Katherine", "Jean-Luc", "Alexander", "Mikhail", "Elizabeth"]);
    const last = choice(rand, ["Bliha", "O'Connor", "Johnson", "McDonald", "Picard", "Petrov", "Gorbachov", "Turner"]);
    name = `${first} ${last}`;
  }

  return name.replace(/\s+/g, " ").trim();
}




const NICKNAMES = new Map([
  // conservative per spec
  ["bob", "robert"],
  ["liz", "elizabeth"],
]);

function isSingleAdjacentTransposition(a, b) {
  if (a.length !== b.length || a === b) return false;
  const diffs = [];
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) diffs.push(i);
    if (diffs.length > 2) return false;
  }
  if (diffs.length !== 2) return false;
  const [i, j] = diffs;
  if (j !== i + 1) return false;
  return a[i] === b[j] && a[j] === b[i];
}

function levenshteinRatio(a, b) {
  a = String(a);
  b = String(b);
  if (a === b) return 1;
  const n = a.length;
  const m = b.length;
  if (n === 0 || m === 0) return 0;
  // DP with two rows (tokens are small)
  let prev = new Array(m + 1);
  let cur = new Array(m + 1);
  for (let j = 0; j <= m; j++) prev[j] = j;
  for (let i = 1; i <= n; i++) {
    cur[0] = i;
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= m; j++) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, cur] = [cur, prev];
  }
  const dist = prev[m];
  return 1 - dist / Math.max(n, m);
}

function stripPunctKeepSpace(s) {
  // keep letters/digits/spaces, drop punctuation/hyphens/apostrophes
  return String(s)
    .replace(/[’`´]/g, "'")
    .replace(/'/g, "") // O'Connor -> OConnor (treat apostrophe as removal, not token split)
    .replace(/[^0-9A-Za-z\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function collapseDoubleLetters(s) {
  return s.replace(/(.)\1+/g, "$1");
}

function phoneticishToken(tok) {
  let t = String(tok).toLowerCase();
  if (NICKNAMES.has(t)) t = NICKNAMES.get(t);

  // common explicit equivalences seen in spec cases (kept narrow/deterministic)
  if (/^moh?amm?e?d$/.test(t) || /^muh?amm?a?d$/.test(t) || /^moh?amm?a?d$/.test(t)) t = "muhammad";
  if (/^yous+e?f$/.test(t) || /^yous+ef$/.test(t)) t = "yusuf";
  if (t === "jonathon") t = "jonathan";
  if (t === "stephen") t = "steven";
  if (t === "sarah") t = "sara";
  if (t === "sean") t = "shawn";
  if (t === "alexander") t = "aleksandr";

  t = t.replaceAll("ph", "f");
  t = t.replaceAll("ou", "u");
  t = t.replaceAll("oo", "u");
  t = t.replaceAll("y", "i");
  t = t.replaceAll("kh", "h");
  t = t.replaceAll("q", "k");
  t = t.replaceAll("c", "k"); // Catherine ~ Katherine

  t = t.replaceAll("v", "f");
  t = t.replace(/(ov|ev)$/g, "off");
  t = t.replace(/(chev|chov)$/g, "kof");
  t = t.replace(/^mc/g, "mac");

  t = collapseDoubleLetters(t);
  return t;
}

function tokenize(name) {
  const cleaned = stripPunctKeepSpace(name);
  if (!cleaned) return [];
  return cleaned.toLowerCase().split(" ");
}

function joinAlCompounds(tokens) {
  const joined = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (i + 1 < tokens.length && (t === "al" || t === "abdul")) {
      joined.push(t + tokens[i + 1]);
      i += 1;
    } else {
      joined.push(t);
    }
  }
  return { primary: tokens, joined };
}

function jaroWinkler(a, b) {
  a = String(a);
  b = String(b);
  if (a === b) return 1;
  const al = a.length;
  const bl = b.length;
  if (al === 0 || bl === 0) return 0;

  const matchDistance = Math.max(0, Math.floor(Math.max(al, bl) / 2) - 1);
  const aMatch = new Array(al).fill(false);
  const bMatch = new Array(bl).fill(false);

  let matches = 0;
  for (let i = 0; i < al; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, bl);
    for (let j = start; j < end; j++) {
      if (bMatch[j]) continue;
      if (a[i] !== b[j]) continue;
      aMatch[i] = true;
      bMatch[j] = true;
      matches++;
      break;
    }
  }
  if (matches === 0) return 0;

  let t = 0;
  let k = 0;
  for (let i = 0; i < al; i++) {
    if (!aMatch[i]) continue;
    while (!bMatch[k]) k++;
    if (a[i] !== b[k]) t++;
    k++;
  }
  const transpositions = t / 2;
  const jaro = (matches / al + matches / bl + (matches - transpositions) / matches) / 3;

  // Winkler boost (common prefix up to 4)
  let prefix = 0;
  const maxPrefix = 4;
  for (let i = 0; i < Math.min(maxPrefix, al, bl); i++) {
    if (a[i] === b[i]) prefix++;
    else break;
  }
  const p = 0.1;
  return jaro + prefix * p * (1 - jaro);
}

function sequenceTokenScore(a, b) {
  if (!a.length || !b.length) return 0;
  if (Math.abs(a.length - b.length) >= 3) return 0;
  const n = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < n; i++) sum += jaroWinkler(a[i], b[i]);
  const extraPenalty = 0.06 * Math.abs(a.length - b.length);
  return Math.max(0, sum / n - extraPenalty);
}

function firstTokenStrict(a, b) {
  if (!a.length || !b.length) return 0;
  const aa = a[0];
  const bb = b[0];
  if (aa === bb) return 1;
  const jw = jaroWinkler(aa, bb);
  const lev = isSingleAdjacentTransposition(aa, bb) ? 1 : levenshteinRatio(aa, bb);
  // combine: force both to be reasonably strong to avoid Michael/Michelle, Maria/Mario, etc.
  return Math.min(jw, lev);
}

export function verifyCandidate(candidateName, latestTargetName) {
  if (!latestTargetName || !String(latestTargetName).trim()) {
    return {
      match: false,
      confidence: 0,
      reason: "No target name has been generated yet. Run `generate` first.",
      target_name: "",
    };
  }

  const candRaw = tokenize(candidateName);
  const targRaw = tokenize(latestTargetName);

  const candTok = joinAlCompounds(candRaw);
  const targTok = joinAlCompounds(targRaw);

  const candP = candTok.primary.map(phoneticishToken);
  const targP = targTok.primary.map(phoneticishToken);
  const candJ = candTok.joined.map(phoneticishToken);
  const targJ = targTok.joined.map(phoneticishToken);

  const candStr = candP.join(" ");
  const targStr = targP.join(" ");
  const candCompact = candStr.replaceAll(" ", "");
  const targCompact = targStr.replaceAll(" ", "");

  const overall = Math.max(jaroWinkler(candStr, targStr), jaroWinkler(candCompact, targCompact));
  const seq = Math.max(sequenceTokenScore(candP, targP), sequenceTokenScore(candJ, targJ));
  const first = Math.max(firstTokenStrict(candP, targP), firstTokenStrict(candJ, targJ));

  // Reject common "extra trailing i" surname variant (spec wants Rashid vs Rashidi => no match)
  const candLast = candP.at(-1) || "";
  const targLast = targP.at(-1) || "";
  if (candLast && targLast && candLast !== targLast) {
    const longer = candLast.length >= targLast.length ? candLast : targLast;
    const shorter = candLast.length >= targLast.length ? targLast : candLast;
    if (longer.length === shorter.length + 1 && longer.endsWith("i") && longer.startsWith(shorter)) {
      return {
        match: false,
        confidence: Math.min(0.4, overall),
        reason: "Surname differs by an extra trailing vowel (treated as different identity per spec).",
        target_name: latestTargetName,
      };
    }
  }

  // Reject pure order inversions when token multiset is equal (spec wants Ali Hassan vs Hassan Ali => no match)
  if (candP.length === targP.length && candP.length >= 2) {
    const a = [...candP].sort().join("|");
    const b = [...targP].sort().join("|");
    if (a === b && candP.join("|") !== targP.join("|")) {
      return {
        match: false,
        confidence: Math.min(0.35, overall),
        reason: "Token order differs (order is treated as identity-significant).",
        target_name: latestTargetName,
      };
    }
  }

  const confidence = Math.max(0, Math.min(1, 0.55 * overall + 0.35 * seq + 0.1 * first));

  const match =
    (seq >= 0.86 && overall >= 0.88 && first >= 0.86) ||
    (seq >= 0.92 && overall >= 0.92 && first >= 0.86);
  const reason = match
    ? `Matched with overall=${overall.toFixed(2)}, ordered-token=${seq.toFixed(2)}, first-token=${first.toFixed(2)} after normalization.`
    : `No match: overall=${overall.toFixed(2)}, ordered-token=${seq.toFixed(2)}, first-token=${first.toFixed(2)} after normalization.`;

  return { match, confidence, reason, target_name: latestTargetName };
}



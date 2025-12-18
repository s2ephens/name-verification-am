## Adobe Money (Name Verification Application)

This repo implements:
- **Target name generator**: prompt → generates exactly one name string and stores it as the “latest target”.
- **Black-box verifier**: candidate name → verifies against the latest target name **using only the stored latest target string**.

### Setup

No dependencies.

```bash
npm test
```

### Run

- **Generate**

```bash
node src/cli.js generate "Please generate a random Arabic sounding name with an Al and ibn both involved."
```

- **Verify**

```bash
node src/cli.js verify "Omar ibn Alkhattab"
```

The verifier prints JSON like:

```json
{"match": true, "confidence": 0.93, "reason": "..."}
```

### Tests

```bash
npm test
```

### Black-box constraint

The generator writes the latest target name to `.am_latest_target.json`.
The verifier reads **only** that single string for matching, and does not call back into the generator.



// Write side of the headless-CMS content pipeline: validates and applies a single
// content change (create/update/delete) under database/public/<contentType>/<slug>.json.
// Invoked by .github/workflows/publish-content.yml with CONTENT_TYPE, ACTION, SLUG and
// PAYLOAD as plain environment variables — never interpolated into a shell string, so
// there's no shell-quoting/injection surface to worry about here, unlike the bash+jq
// version this replaces.
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const ALLOWED_CONTENT_TYPES = ["blog", "snippets"];
const ALLOWED_ACTIONS = ["create", "update", "delete"];
const SLUG_PATTERN = /^[a-z0-9-]+$/;

function readInputs(env) {
  const { CONTENT_TYPE, ACTION, SLUG, PAYLOAD } = env;

  if (!ALLOWED_CONTENT_TYPES.includes(CONTENT_TYPE)) {
    throw new Error(`Unknown contentType '${CONTENT_TYPE}'`);
  }
  if (!ALLOWED_ACTIONS.includes(ACTION)) {
    throw new Error(`Unknown action '${ACTION}'`);
  }
  if (!SLUG_PATTERN.test(SLUG ?? "")) {
    throw new Error(`slug must match ${SLUG_PATTERN}, got '${SLUG}'`);
  }

  let payload;
  if (ACTION !== "delete") {
    if (!PAYLOAD) throw new Error(`payload is required for action '${ACTION}'`);
    try {
      payload = JSON.parse(PAYLOAD);
    } catch (cause) {
      throw new Error("payload is not valid JSON", { cause });
    }
  }

  return { contentType: CONTENT_TYPE, action: ACTION, slug: SLUG, payload };
}

async function applyChange({ contentType, action, slug, payload }) {
  const dir = path.join("database/public", contentType);
  const file = path.join(dir, `${slug}.json`);

  if (action === "delete") {
    await rm(file, { force: true });
  } else {
    await mkdir(dir, { recursive: true });
    await writeFile(file, `${JSON.stringify(payload, null, 2)}\n`);
  }

  return file;
}

const inputs = readInputs(process.env);
const file = await applyChange(inputs);
console.log(`${inputs.action}: ${file}`);

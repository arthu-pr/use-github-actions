// Write side of the headless-CMS content pipeline: validates and applies a single
// content change (create/update/delete) under database/public/<contentType>/<slug>.json,
// via the GitHub REST Contents API — the same PUT/DELETE .../contents/{path} calls
// GitHubDatabaseService (api.arthurplazanet.com) uses for the content types that commit
// directly, so this workflow's write ends up going through the identical primitive
// rather than local git plumbing. Each call is a single-file write against a branch —
// the workflow only checks out this script itself, not the tree being written into.
//
// Invoked by .github/workflows/publish-content.yml with CONTENT_TYPE, ACTION, SLUG and
// PAYLOAD as plain environment variables — never interpolated into a shell string, so
// there's no shell-quoting/injection surface to worry about here.

const ALLOWED_CONTENT_TYPES = ["blog", "snippets"];
const ALLOWED_ACTIONS = ["create", "update", "delete"];
const SLUG_PATTERN = /^[a-z0-9-]+$/;

function readInputs(env) {
  const { CONTENT_TYPE, ACTION, SLUG, PAYLOAD, GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_REF_NAME } =
    env;

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

  if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN is required");
  const [owner, repo] = (GITHUB_REPOSITORY ?? "").split("/");
  if (!owner || !repo) throw new Error(`Unexpected GITHUB_REPOSITORY '${GITHUB_REPOSITORY}'`);
  if (!GITHUB_REF_NAME) throw new Error("GITHUB_REF_NAME is required");

  return {
    contentType: CONTENT_TYPE,
    action: ACTION,
    slug: SLUG,
    payload,
    token: GITHUB_TOKEN,
    owner,
    repo,
    branch: GITHUB_REF_NAME,
  };
}

function api(token) {
  const base = "https://api.github.com";
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  return {
    async getSha(owner, repo, path, branch) {
      const response = await fetch(
        `${base}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
        { headers },
      );
      if (response.status === 404) return undefined;
      if (!response.ok) throw new Error(`GET ${path} failed: ${response.status}`);
      return (await response.json()).sha;
    },

    async putFile(owner, repo, path, { content, message, branch, sha }) {
      const response = await fetch(`${base}/repos/${owner}/${repo}/contents/${path}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          message,
          branch,
          sha,
          content: Buffer.from(content).toString("base64"),
        }),
      });
      if (!response.ok) throw new Error(`PUT ${path} failed: ${response.status} ${await response.text()}`);
    },

    async deleteFile(owner, repo, path, { message, branch, sha }) {
      const response = await fetch(`${base}/repos/${owner}/${repo}/contents/${path}`, {
        method: "DELETE",
        headers,
        body: JSON.stringify({ message, branch, sha }),
      });
      if (!response.ok) throw new Error(`DELETE ${path} failed: ${response.status} ${await response.text()}`);
    },
  };
}

async function applyChange(inputs) {
  const { contentType, action, slug, payload, token, owner, repo, branch } = inputs;
  const path = `database/public/${contentType}/${slug}.json`;
  const github = api(token);

  const sha = await github.getSha(owner, repo, path, branch);

  if (action === "delete") {
    if (!sha) return `nothing to delete: ${path}`;
    await github.deleteFile(owner, repo, path, { message: `delete: ${contentType}/${slug}`, branch, sha });
    return `deleted: ${path}`;
  }

  await github.putFile(owner, repo, path, {
    content: `${JSON.stringify(payload, null, 2)}\n`,
    message: `${action}: ${contentType}/${slug}`,
    branch,
    sha,
  });
  return `${action}: ${path}`;
}

const inputs = readInputs(process.env);
console.log(await applyChange(inputs));

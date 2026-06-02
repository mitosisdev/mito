// src/github.ts — a small GitHub REST client.
//
// fetch is injected (a FetchLike) so unit tests use a fake and never hit the
// network — mirrors how xpost.ts injects TweetPoster. Owner/repo are parsed
// from the `owner/repo` string (e.g. "mitosisdev/mito").

export interface FetchLike {
  (
    url: string,
    init?: { method?: string; headers?: Record<string, string>; body?: string },
  ): Promise<{
    ok: boolean;
    status: number;
    json(): Promise<unknown>;
    text(): Promise<string>;
  }>;
}

export type CiStatus = "success" | "pending" | "failure";

export interface OpenPrInput { head: string; base: string; title: string; body: string; }
export interface OpenPrResult { number: number; url: string; }
export interface OpenPr { number: number; head: string; title: string; url: string; }
export interface PrFile { filename: string; status: string; additions: number; deletions: number; patch?: string; }
export interface MergeResult { merged: boolean; sha?: string; }

export interface Github {
  openPullRequest(input: OpenPrInput): Promise<OpenPrResult>;
  listOpenPullRequests(): Promise<OpenPr[]>;
  countOpenPullRequests(): Promise<number>;
  getPullRequestFiles(number: number): Promise<PrFile[]>;
  getCombinedStatus(ref: string): Promise<CiStatus>;
  mergePullRequest(number: number, opts?: { method?: "squash" | "merge" | "rebase" }): Promise<MergeResult>;
  closePullRequest(number: number): Promise<void>;
  addComment(number: number, body: string): Promise<void>;
  deleteBranch(name: string): Promise<void>;
}

// Adapter so callers can pass globalThis.fetch without an `as any` cast.
// The narrower FetchLike signature is a structural subset of the full Fetch API.
export function nativeFetch(): FetchLike {
  return globalThis.fetch as unknown as FetchLike;
}

export interface MakeGithubOpts { repo: string; token: string; fetch: FetchLike; }

const API = "https://api.github.com";

export function makeGithub({ repo, token, fetch }: MakeGithubOpts): Github {
  const parts = repo.split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(`MITO_GITHUB_REPO must be "owner/repo", got "${repo}"`);
  }
  const [owner, name] = parts as [string, string];
  const base = `${API}/repos/${owner}/${name}`;

  const headers = (): Record<string, string> => ({
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
    "User-Agent": "mito",
  });

  // Issue a request that must succeed; throw a descriptive error otherwise.
  async function call(method: string, url: string, body?: unknown): Promise<unknown> {
    const res = await fetch(url, {
      method,
      headers: headers(),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`GitHub ${method} ${url} -> ${res.status} ${detail}`);
    }
    // 204 No Content (e.g. DELETE) has no JSON body.
    if (res.status === 204) return undefined;
    return res.json();
  }

  return {
    async openPullRequest(input) {
      const j = (await call("POST", `${base}/pulls`, {
        head: input.head, base: input.base, title: input.title, body: input.body,
      })) as { number: number; html_url: string };
      return { number: j.number, url: j.html_url };
    },

    async listOpenPullRequests() {
      const j = (await call("GET", `${base}/pulls?state=open`)) as Array<{
        number: number; title: string; html_url: string; head: { ref: string };
      }>;
      return j.map((p) => ({ number: p.number, head: p.head.ref, title: p.title, url: p.html_url }));
    },

    async countOpenPullRequests() {
      return (await this.listOpenPullRequests()).length;
    },

    async getPullRequestFiles(number) {
      const j = (await call("GET", `${base}/pulls/${number}/files`)) as Array<{
        filename: string; status: string; additions: number; deletions: number; patch?: string;
      }>;
      return j.map((f) => ({
        filename: f.filename, status: f.status, additions: f.additions, deletions: f.deletions, patch: f.patch,
      }));
    },

    async getCombinedStatus(ref) {
      const j = (await call("GET", `${base}/commits/${ref}/check-runs`)) as {
        check_runs: Array<{ status: string; conclusion: string | null }>;
      };
      const runs = j.check_runs ?? [];
      if (runs.length === 0) return "pending";
      if (runs.some((r) => r.status !== "completed")) return "pending";
      // Treat success + neutral + skipped as non-blocking green; anything else fails.
      const ok = new Set(["success", "neutral", "skipped"]);
      if (runs.some((r) => !ok.has(r.conclusion ?? ""))) return "failure";
      return "success";
    },

    async mergePullRequest(number, opts) {
      const j = (await call("PUT", `${base}/pulls/${number}/merge`, {
        merge_method: opts?.method ?? "squash",
      })) as { merged: boolean; sha?: string };
      return { merged: j.merged, sha: j.sha };
    },

    async closePullRequest(number) {
      await call("PATCH", `${base}/pulls/${number}`, { state: "closed" });
    },

    async addComment(number, body) {
      await call("POST", `${base}/issues/${number}/comments`, { body });
    },

    async deleteBranch(branchName) {
      // Best-effort: a branch may already be gone after a merge. GitHub returns
      // 422 (or 404) for a missing ref — swallow those, surface anything else.
      const res = await fetch(`${base}/git/refs/heads/${branchName}`, {
        method: "DELETE",
        headers: headers(),
      });
      if (res.ok || res.status === 404 || res.status === 422) return;
      const detail = await res.text().catch(() => "");
      throw new Error(`GitHub DELETE branch ${branchName} -> ${res.status} ${detail}`);
    },
  };
}

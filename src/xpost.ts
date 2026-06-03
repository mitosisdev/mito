// src/xpost.ts
import { checkContent } from "./safety";
import type { PullRequestRecord } from "./state";

export interface PostedTweet { id: string; url: string; }
export interface TweetPoster { post(text: string): Promise<PostedTweet>; }

export interface PostUpdateResult { posted: boolean; url?: string; reasons: string[]; }

export async function postUpdate(poster: TweetPoster, text: string): Promise<PostUpdateResult> {
  const safety = checkContent(text);
  if (!safety.ok) return { posted: false, reasons: safety.reasons };
  const tweet = await poster.post(text);
  return { posted: true, url: tweet.url, reasons: [] };
}

/** Draft a tweet announcing a merged PR. Always ≤280 chars. */
export function draftMergeMessage(pr: PullRequestRecord): string {
  const suffix = `${pr.url ? ` ${pr.url}` : ""} #buildinpublic #mito`;
  const prefix = "✅ Merged: ";
  const maxTitle = 280 - prefix.length - suffix.length;
  const title = pr.title.length > maxTitle
    ? `${pr.title.slice(0, maxTitle - 1)}…`
    : pr.title;
  return `${prefix}${title}${suffix}`;
}

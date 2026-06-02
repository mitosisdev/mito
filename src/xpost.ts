// src/xpost.ts
import { checkContent } from "./safety";

export interface PostedTweet { id: string; url: string; }
export interface TweetPoster { post(text: string): Promise<PostedTweet>; }

export interface PostUpdateResult { posted: boolean; url?: string; reasons: string[]; }

export async function postUpdate(poster: TweetPoster, text: string): Promise<PostUpdateResult> {
  const safety = checkContent(text);
  if (!safety.ok) return { posted: false, reasons: safety.reasons };
  const tweet = await poster.post(text);
  return { posted: true, url: tweet.url, reasons: [] };
}

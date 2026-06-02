// src/x-poster.ts
import { TwitterApi } from "twitter-api-v2";
import type { TweetPoster, PostedTweet } from "./xpost";
import type { Config } from "./config";

export function makeXPoster(cfg: Config): TweetPoster {
  const client = new TwitterApi({
    appKey: cfg.x.apiKey,
    appSecret: cfg.x.apiSecret,
    accessToken: cfg.x.accessToken,
    accessSecret: cfg.x.accessSecret,
  });
  return {
    async post(text: string): Promise<PostedTweet> {
      const res = await client.v2.tweet(text);
      const id = res.data.id;
      return { id, url: `https://x.com/i/web/status/${id}` };
    },
  };
}

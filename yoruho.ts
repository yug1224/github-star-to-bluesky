import 'https://deno.land/std@0.193.0/dotenv/load.ts';
import AtprotoAPI from 'npm:@atproto/api';

// Blueskyに接続
const { BskyAgent } = AtprotoAPI;
const service = 'https://bsky.social';
const agent = new BskyAgent({ service });
const identifier = Deno.env.get('BLUESKY_IDENTIFIER') || '';
const password = Deno.env.get('BLUESKY_PASSWORD') || '';
await agent.login({ identifier, password });

// Blueskyに投稿
const hour = new Date().getHours();
const text = hour ? `なるほど${hour}時じゃねーの` : 'よるほー';
const postObj = {
  $type: 'app.bsky.feed.post',
  text,
};
await agent.post(postObj);

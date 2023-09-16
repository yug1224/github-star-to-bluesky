import { parseFeed } from 'https://deno.land/x/rss@0.6.0/mod.ts';

const lastExecutionTime = await Deno.readTextFile('.timestamp');
console.log(lastExecutionTime.trim());

export default async () => {
  const RSS_URL = Deno.env.get('RSS_URL');
  if (!RSS_URL) {
    console.log('RSS_URL is not defined');
    return [];
  }

  const response = await fetch(RSS_URL);
  const xml = await response.text();
  const feed = await parseFeed(xml);

  // 最終実行時間以降かつdescriptionがある記事を抽出
  const foundList = feed.entries.reverse().filter((item) => {
    return (
      item.published &&
      new Date(lastExecutionTime.trim()) < new Date(item.published) &&
      new RegExp('starred', 'g').test(item.title?.value || '')
    );
  });
  // foundListの1件目までを返す
  return foundList.slice(0, 1);
};

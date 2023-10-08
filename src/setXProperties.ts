import { FeedEntry } from 'https://deno.land/x/rss@0.6.0/src/types/mod.ts';
import defaultsGraphemer from 'npm:graphemer';

const Graphemer = defaultsGraphemer.default;
const splitter = new Graphemer();

export default async ({ item }: { item: FeedEntry }) => {
  const title: string = item.title?.value || '';
  const link: string = item.links[0].href || '';

  // X用のテキストを作成
  const xText = (() => {
    const max = 118;
    const text = `${title}\n${link}`;
    if (splitter.countGraphemes(title) <= max) return text;
    const ellipsis = '...\n';
    const cnt = max - ellipsis.length;
    const shortenedTitle = splitter
      .splitGraphemes(title)
      .slice(0, cnt)
      .join('');
    return `${shortenedTitle}${ellipsis}${link}`;
  })();

  console.log('success setXProperties');
  return { xText };
};

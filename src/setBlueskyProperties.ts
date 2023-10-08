import { FeedEntry } from 'https://deno.land/x/rss@0.6.0/src/types/mod.ts';
import defaultsGraphemer from 'npm:graphemer';

const Graphemer = defaultsGraphemer.default;
const splitter = new Graphemer();

import AtprotoAPI, { BskyAgent } from 'npm:@atproto/api';
const { RichText } = AtprotoAPI;

export default async ({ agent, item }: {
  agent: BskyAgent;
  item: FeedEntry;
}) => {
  const title: string = item.title?.value || '';
  const link = item.links[0].href || '';

  // Bluesky用のテキストを作成
  const bskyText = await (async () => {
    const max = 300;
    const { host, pathname } = new URL(link);
    const ellipsis = `...\n`;
    const key = splitter.splitGraphemes(`${host}${pathname}`).slice(0, 19).join('') + ellipsis;
    let text = `${title}\n${key}`;

    if (splitter.countGraphemes(text) > max) {
      const ellipsis = `...\n`;
      const cnt = max - splitter.countGraphemes(`${ellipsis}${key}`);
      const shortenedTitle = splitter
        .splitGraphemes(title)
        .slice(0, cnt)
        .join('');
      text = `${shortenedTitle}${ellipsis}${key}`;
    }

    const rt = new RichText({ text });
    await rt.detectFacets(agent);
    rt.facets = [
      {
        index: {
          byteStart: rt.unicodeText.length - splitter.countGraphemes(key),
          byteEnd: rt.unicodeText.length,
        },
        features: [
          {
            $type: 'app.bsky.richtext.facet#link',
            uri: link,
          },
        ],
      },
      ...(rt.facets || []),
    ];
    return rt;
  })();

  console.log('success setBlueskyProperties');
  return { bskyText };
};

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
  const title: string = (item.title?.value || '').trim();
  const link = item.links[0].href || '';

  // Bluesky用のテキストを作成
  const bskyText = await (async () => {
    const { host, pathname } = new URL(link);
    const key = splitter.splitGraphemes(`${host}${pathname}`).slice(0, 19).join('') + '...';
    const text = `${title}\n${key}\n---`;

    const rt = new RichText({ text });
    await rt.detectFacets(agent);
    rt.facets = [
      {
        index: {
          byteStart: rt.unicodeText.length - splitter.countGraphemes(`${key}\n---`),
          byteEnd: rt.unicodeText.length - splitter.countGraphemes('\n---'),
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

import { FeedEntry } from 'https://deno.land/x/rss@0.6.0/src/types/mod.ts';
import AtprotoAPI from 'npm:@atproto/api';
import defaultsGraphemer from 'npm:graphemer';

const Graphemer = defaultsGraphemer.default;
const splitter = new Graphemer();

const { BskyAgent, RichText } = AtprotoAPI;
const service = 'https://bsky.social';
const agent = new BskyAgent({ service });

export default async (item: FeedEntry) => {
  const title: string = item.title?.value || '';
  const description: string = item.description?.value || '';
  const link: string = item.links[0].href || '';

  // Bluesky用のテキストを作成
  const bskyText = await (async () => {
    const max = 300;
    const { host, pathname } = new URL(link);
    const ellipsis = `...\n`;
    const key =
      splitter.splitGraphemes(`${host}${pathname}`).slice(0, 19).join('') +
      ellipsis;
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

  console.log('success createProperties');
  return { bskyText, xText, title, link, description };
};

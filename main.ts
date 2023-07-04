import 'https://deno.land/std@0.193.0/dotenv/load.ts';
import { Image } from 'https://deno.land/x/imagescript@1.2.15/mod.ts';
import { parseFeed } from 'https://deno.land/x/rss@0.6.0/mod.ts';
import AtprotoAPI from 'npm:@atproto/api';
import ogs from 'npm:open-graph-scraper';

// rss feedから最新のスターを付けた記事リストを取得
const getStarredItemList = async () => {
  const response = await fetch(Deno.env.get('RSS_URL') || '');
  const xml = await response.text();
  const feed = await parseFeed(xml);

  const foundList = feed.entries.reverse().filter((item) => {
    return (
      new Date(new Date(Deno.env.get('LAST_EXECUTION_TIME') || '')) <
        new Date(item.published) &&
      new RegExp('starred', 'g').test(item.title.value)
    );
  });
  return foundList;
};
const starredItemList = await getStarredItemList();
console.log(starredItemList);

// 対象がなかったら終了
if (!starredItemList.length) {
  console.log('not found starred item');
  Deno.exit(0);
}

// blueskyに接続
const { BskyAgent, RichText } = AtprotoAPI;
const service = 'https://bsky.social';
const agent = new BskyAgent({ service });
const identifier = Deno.env.get('BLUESKY_IDENTIFIER') || '';
const password = Deno.env.get('BLUESKY_PASSWORD') || '';
await agent.login({ identifier, password });

// 取得した記事リストをループ処理
for await (const starredItem of starredItemList) {
  // 投稿予定のテキストを作成
  const text = `${starredItem.title.value}\n${starredItem.links[0].href}`;

  const pattern =
    /https?:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#\u3000-\u30FE\u4E00-\u9FA0\uFF01-\uFFE3]+/g;
  const [url] = text.match(pattern) || [''];

  // URLからOGPの取得
  const getOgp = async (url: string) => {
    const { result } = await ogs({ url });

    const ogImage = result.ogImage?.at(0);
    const response = await fetch(ogImage?.url || '');
    const buffer = await response.arrayBuffer();

    const image = await Image.decode(buffer);
    const resizedImage = await image
      .resize(800, Image.RESIZE_AUTO)
      .encodeJPEG(80);

    return {
      url: ogImage?.url || '',
      type: ogImage?.type || '',
      description: result.ogDescription || '',
      title: result.ogTitle || '',
      image: resizedImage,
    };
  };
  const og = await getOgp(url);

  // 画像をアップロード
  const uploadedImage = await agent.uploadBlob(og.image, {
    encoding: 'image/jpeg',
  });

  // blueskyに投稿
  const rt = new RichText({ text });
  await rt.detectFacets(agent);
  console.log(rt.text, rt.facets);

  const postObj = {
    $type: 'app.bsky.feed.post',
    text: rt.text,
    facets: rt.facets,
    embed: {
      $type: 'app.bsky.embed.external',
      external: {
        uri: url,
        thumb: {
          $type: 'blob',
          ref: {
            $link: uploadedImage.data.blob.ref.toString(),
          },
          mimeType: uploadedImage.data.blob.mimeType,
          size: uploadedImage.data.blob.size,
        },
        title: og.title,
        description: og.description,
      },
    },
  };

  const result = await agent.post(postObj);
  console.log(result);
}

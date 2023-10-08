import 'https://deno.land/std@0.193.0/dotenv/load.ts';
import { delay } from 'https://deno.land/std@0.201.0/async/mod.ts';
import AtprotoAPI from 'npm:@atproto/api';
import getItemList from './src/getItemList.ts';
import getOgp from './src/getOgp.ts';
import postBluesky from './src/postBluesky.ts';
import postWebhook from './src/postWebhook.ts';
import resizeImage from './src/resizeImage.ts';
import setBlueskyProperties from './src/setBlueskyProperties.ts';
import setXProperties from './src/setXProperties.ts';

try {
  // rss feedから記事リストを取得
  const itemList = await getItemList();
  console.log(JSON.stringify(itemList, null, 2));

  // 対象がなかったら終了
  if (!itemList.length) {
    console.log('not found feed item');
    Deno.exit(0);
  }

  // Blueskyにログイン
  const { BskyAgent } = AtprotoAPI;
  const service = 'https://bsky.social';
  const agent = new BskyAgent({ service });
  const identifier = Deno.env.get('BLUESKY_IDENTIFIER') || '';
  const password = Deno.env.get('BLUESKY_PASSWORD') || '';
  await agent.login({ identifier, password });

  // 取得した記事リストをループ処理
  for await (const item of itemList) {
    // 最終実行時間を更新
    const timestamp = item.published ? new Date(item.published).toISOString() : new Date().toISOString();
    await Deno.writeTextFile('.timestamp', timestamp);

    const link = item.links[0].href || '';

    // URLからOGPの取得
    const og = await getOgp(link);

    // 投稿記事のプロパティを作成
    const { bskyText } = await setBlueskyProperties({ agent, item });
    const { xText } = await setXProperties({ item });

    // 画像のリサイズ
    const { mimeType, resizedImage } = await (async () => {
      const ogImage = og.ogImage?.at(0);
      if (!ogImage) {
        console.log('ogp image not found');
        return {};
      }
      return await resizeImage(new URL(ogImage.url, link).href);
    })();

    // Blueskyに投稿
    await postBluesky({
      agent,
      rt: bskyText,
      title: og.ogTitle || '',
      link,
      description: og.ogDescription || '',
      mimeType,
      image: resizedImage,
    });

    // IFTTTを使ってXに投稿
    await postWebhook(xText);

    // 30秒待つ
    console.log('wait 30 seconds');
    await delay(1000 * 30);
  }

  // 終了
  Deno.exit(0);
} catch (e) {
  // エラーが発生したらログを出力して終了
  console.error(e.stack);
  console.error(JSON.stringify(e, null, 2));
  Deno.exit(1);
}

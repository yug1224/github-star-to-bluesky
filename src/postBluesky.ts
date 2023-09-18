import { abortable } from 'https://deno.land/std@0.201.0/async/abortable.ts';
import AtprotoAPI, { BskyAgent, RichText } from 'npm:@atproto/api';

export default async ({
  agent,
  rt,
  title,
  link,
  description,
  mimeType,
  image,
}: {
  agent: BskyAgent;
  rt: RichText;
  title: string;
  link: string;
  description: string;
  mimeType?: string;
  image?: Uint8Array;
}) => {
  const thumb = await (async () => {
    try {
      if (image instanceof Uint8Array && typeof mimeType === 'string') {
        const c = new AbortController();
        // 10秒でタイムアウト
        setTimeout(() => c.abort(), 1000 * 10);

        // 画像をアップロード
        const uploadedImage = await abortable(
          agent.uploadBlob(image, {
            encoding: mimeType,
          }),
          c.signal,
        );
        console.log('success to upload image');

        // 投稿オブジェクトに画像を追加
        return {
          $type: 'blob',
          ref: {
            $link: uploadedImage.data.blob.ref.toString(),
          },
          mimeType: uploadedImage.data.blob.mimeType,
          size: uploadedImage.data.blob.size,
        };
      }
      return;
    } catch (e) {
      console.log(JSON.stringify(e, null, 2));
      console.log('failed to upload image');
      return;
    }
  })();

  const postObj:
    & Partial<AtprotoAPI.AppBskyFeedPost.Record>
    & Omit<AtprotoAPI.AppBskyFeedPost.Record, 'createdAt'> = {
      $type: 'app.bsky.feed.post',
      text: rt.text,
      facets: rt.facets,
      embed: {
        $type: 'app.bsky.embed.external',
        external: {
          uri: link,
          title,
          description,
          thumb,
        },
      },
      langs: ['ja'],
    };

  console.log(JSON.stringify(postObj, null, 2));
  await agent.post(postObj);
  console.log('post to Bluesky');
};

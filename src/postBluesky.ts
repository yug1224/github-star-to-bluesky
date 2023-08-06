import AtprotoAPI from 'npm:@atproto/api';

// Blueskyに接続
const { BskyAgent, RichText } = AtprotoAPI;
const service = 'https://bsky.social';
const agent = new BskyAgent({ service });
const identifier = Deno.env.get('BLUESKY_IDENTIFIER') || '';
const password = Deno.env.get('BLUESKY_PASSWORD') || '';
await agent.login({ identifier, password });

export default async (
  text: string,
  title: string,
  link: string,
  og: {
    type?: string | undefined;
    image?: Uint8Array | undefined;
    description?: string | undefined;
  }
) => {
  const rt = new RichText({ text });
  await rt.detectFacets(agent);

  const postObj: Partial<AtprotoAPI.AppBskyFeedPost.Record> &
    Omit<AtprotoAPI.AppBskyFeedPost.Record, 'createdAt'> = {
    $type: 'app.bsky.feed.post',
    text: rt.text,
    facets: rt.facets,
  };

  if (og.image instanceof Uint8Array && typeof og.type === 'string') {
    // 画像をアップロード
    const uploadedImage = await agent.uploadBlob(og.image, {
      encoding: og.type,
    });

    // 投稿オブジェクトに画像を追加
    postObj.embed = {
      $type: 'app.bsky.embed.external',
      external: {
        uri: link,
        thumb: {
          $type: 'blob',
          ref: {
            $link: uploadedImage.data.blob.ref.toString(),
          },
          mimeType: uploadedImage.data.blob.mimeType,
          size: uploadedImage.data.blob.size,
        },
        title,
        description: og.description,
      },
    };
  }
  console.log(JSON.stringify(postObj, null, 2));
  await agent.post(postObj);
  console.log('post to Bluesky');
};

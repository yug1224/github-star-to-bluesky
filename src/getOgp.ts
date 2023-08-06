import { Image, GIF } from 'https://deno.land/x/imagescript@1.2.15/mod.ts';
import ogs from 'npm:open-graph-scraper';

export default async (
  url: string
): Promise<{ type?: string; image?: Uint8Array; description?: string }> => {
  const res = await fetch(url, {
    headers: { 'user-agent': 'Twitterbot' },
  }).catch(() => {});

  // OGP取得のリクエストに失敗した場合は空オブジェクトを返す
  if (!res) {
    console.log('failed to get ogp');
    return {};
  }

  const html = await res.text();
  const { result } = await ogs({ html });
  console.log(JSON.stringify(result, null, 2));
  const ogImage = result.ogImage?.at(0);

  // OGPに画像がない場合は空オブジェクトを返す
  if (!ogImage?.url) {
    console.log('ogp image not found');
    return {};
  }

  const response = await fetch(new URL(ogImage.url, url).href);
  const contentType = response.headers.get('content-type');

  // 画像が取得できなかった場合は空オブジェクトを返す
  if (!response.ok || !contentType?.includes('image')) {
    console.log('failed to get image');
    return {};
  }

  const buffer = await response.arrayBuffer();

  let type, resizedImage;
  try {
    // TODO: 画像を1MB以下になるまでリサイズしたい
    if (contentType.includes('gif')) {
      type = 'image/gif';
      const gif = await GIF.decode(buffer, true);
      resizedImage = await gif.encode();
    } else {
      type = 'image/jpeg';
      const image = await Image.decode(buffer);
      resizedImage =
        image.width < 1024 && image.height < 1024
          ? await image.encodeJPEG()
          : await image
              .resize(
                image.width >= image.height ? 1024 : Image.RESIZE_AUTO,
                image.width < image.height ? 1024 : Image.RESIZE_AUTO
              )
              .encodeJPEG();
    }
  } catch {
    // 画像のリサイズに失敗した場合は空オブジェクトを返す
    console.log('failed to resize image');
    return {};
  }

  return {
    type,
    image: resizedImage,
    description: result.ogDescription,
  };
};

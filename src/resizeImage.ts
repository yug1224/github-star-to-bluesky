import { Image, GIF } from 'https://deno.land/x/imagescript@1.2.15/mod.ts';

export default async (url: string) => {
  const response = await fetch(url);
  const contentType = response.headers.get('content-type');

  // 画像が取得できなかった場合は空オブジェクトを返す
  if (!response.ok || !contentType?.includes('image')) {
    console.log('failed to get image');
    return {};
  }

  const buffer = await response.arrayBuffer();

  let mimeType, resizedImage;
  try {
    // TODO: 画像を1MB以下になるまでリサイズしたい
    if (contentType.includes('gif')) {
      mimeType = 'image/gif';
      const gif = await GIF.decode(buffer, true);
      resizedImage = await gif.encode();
    } else {
      mimeType = 'image/jpeg';
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
    console.log('success to resize image');
  } catch {
    // 画像のリサイズに失敗した場合は空オブジェクトを返す
    console.log('failed to resize image');
    return {};
  }

  return {
    mimeType,
    resizedImage,
  };
};

import { GIF, Image } from 'https://deno.land/x/imagescript@1.2.15/mod.ts';

interface fetchRetry {
  response?: Response;
  contentType?: string;
}

export default async (url: string) => {
  const fetchRetry = async (url: string, retryCount = 0): Promise<fetchRetry> => {
    const response = await fetch(url);
    const contentType = response.headers.get('content-type');

    // 画像が取得できなかった場合
    if (!response.ok || !contentType?.includes('image')) {
      // 3回リトライしてもダメなら空オブジェクトを返す
      if (retryCount >= 3) return {};

      // リトライ処理
      console.log(`fetch retry ${retryCount + 1} times`);
      return await fetchRetry(url, retryCount + 1);
    }

    return {
      response,
      contentType,
    };
  };
  const { response, contentType } = await fetchRetry(url);
  if (!response || !contentType) {
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
      const maxWidth = 1200;
      const maxHeight = 1200;
      const maxByteLength = 976.56 * 1000;
      resizedImage = (image.width <= maxWidth && image.height <= maxHeight) && (buffer.byteLength <= maxByteLength)
        ? await image.encodeJPEG()
        : await image
          .resize(
            image.width >= image.height ? maxWidth : Image.RESIZE_AUTO,
            image.width < image.height ? maxHeight : Image.RESIZE_AUTO,
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

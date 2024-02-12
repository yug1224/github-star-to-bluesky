import sharp from 'npm:sharp';

export default async (url: string) => {
  const fetchRetry = async (url: string, retryCount = 0): Promise<Response | undefined> => {
    const response = await fetch(url);
    const contentType = response.headers.get('content-type') || '';

    // 画像が取得できなかった場合
    if (!response.ok || !contentType?.includes('image')) {
      // 3回リトライしてもダメならundefinedを返す
      if (retryCount >= 3) return;

      // リトライ処理
      console.log(`fetch retry ${retryCount + 1} times`);
      return await fetchRetry(url, retryCount + 1);
    }
    return response;
  };
  const response = await fetchRetry(url);
  if (!response) {
    console.log('failed to get image');
    return {};
  }
  const buffer = await response.arrayBuffer();

  try {
    const resizeRetry = async ({
      buffer,
      retryCount = 0,
    }: {
      buffer: ArrayBuffer;
      retryCount?: number;
    }): Promise<{ mimeType?: string; resizedImage?: Uint8Array }> => {
      const image = await sharp(buffer);
      const { width, height } = await image.metadata();

      const mimeType = 'image/avif';
      const maxWidth = 2000;
      const maxHeight = 2000;
      const maxByteLength = 976.56 * 1000;
      const resizeWidth = width && height && width >= height ? maxWidth : undefined;
      const resizeHeight = width && height && width < height ? maxHeight : undefined;

      const resizedImage = await image.resize({ width: resizeWidth, height: resizeHeight }).avif({
        quality: 100 - (retryCount * 2),
      }).toBuffer();

      console.log('resizedImage.byteLength', resizedImage.byteLength);
      if (resizedImage && resizedImage.byteLength > maxByteLength) {
        // リトライ処理
        console.log(`resize retry ${retryCount + 1} times`);
        return await resizeRetry({ buffer, retryCount: retryCount + 1 });
      }
      return { mimeType, resizedImage };
    };
    const { mimeType, resizedImage } = await resizeRetry({ buffer });

    console.log('success to resize image');
    return {
      mimeType,
      resizedImage,
    };
  } catch {
    // 画像のリサイズに失敗した場合は空オブジェクトを返す
    console.log('failed to resize image');
    return {};
  }
};

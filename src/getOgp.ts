import ogs from 'npm:open-graph-scraper';

export default async (url: string) => {
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
  console.log('success to get ogp');
  return result;
};

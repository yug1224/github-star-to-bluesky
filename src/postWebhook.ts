export default async (text: string) => {
  const WEBHOOK_URL = Deno.env.get('WEBHOOK_URL');
  if (!WEBHOOK_URL) {
    console.log('WEBHOOK_URL is not defined');
    return;
  }

  await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ value1: text }),
  });
  console.log('post to X');
};

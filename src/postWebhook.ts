export default async (text: string) => {
  const WEBHOOK_URL = Deno.env.get('WEBHOOK_URL');
  if (!WEBHOOK_URL) {
    console.log('WEBHOOK_URL is not defined');
    return;
  }

  const postObj = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ value1: text }),
  };

  console.log(JSON.stringify(postObj, null, 2));
  await fetch(WEBHOOK_URL, postObj);
  console.log('post to X');
};

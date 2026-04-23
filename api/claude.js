export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { systemPrompt, userMessage, thinking, model: modelOverride } = req.body;

  if (!systemPrompt || !userMessage) {
    return res.status(400).json({ error: 'Missing systemPrompt or userMessage' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY environment variable is not set' });
  }

  const requestBody = {
    model: modelOverride || (thinking ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001'),
    max_tokens: (modelOverride || thinking) ? 16000 : 1500,
    stream: true,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  };

  if (thinking) {
    requestBody.thinking = { type: 'enabled', budget_tokens: 10000 };
  }

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!upstream.ok) {
    const err = await upstream.json().catch(() => ({}));
    return res.status(upstream.status).json({ error: err?.error?.message || `Claude API error ${upstream.status}` });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const decoder = new TextDecoder();
  let currentBlockType = null;

  for await (const chunk of upstream.body) {
    const lines = decoder.decode(chunk).split('\n');
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') break;

      try {
        const parsed = JSON.parse(data);

        if (parsed.type === 'content_block_start') {
          currentBlockType = parsed.content_block?.type ?? null;
        }

        if (parsed.type === 'content_block_delta') {
          if (parsed.delta?.type === 'thinking_delta' && parsed.delta.thinking) {
            res.write(`data: ${JSON.stringify({ type: 'thinking', text: parsed.delta.thinking })}\n\n`);
          } else if (parsed.delta?.type === 'text_delta' && parsed.delta.text) {
            res.write(`data: ${JSON.stringify({ type: 'text', text: parsed.delta.text })}\n\n`);
          }
        }
      } catch {}
    }
  }

  res.write('data: [DONE]\n\n');
  res.end();
}

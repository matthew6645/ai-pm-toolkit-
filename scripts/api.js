async function callClaude(systemPrompt, userMessage) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": CONFIG.CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }]
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

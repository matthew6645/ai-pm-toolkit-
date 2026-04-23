function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// options: { thinking: bool, onThinking: fn, model: string }
async function callClaude(systemPrompt, userMessage, onChunk, options = {}) {
  const { thinking = false, onThinking = null, model = null } = options;

  const response = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt, userMessage, thinking, ...(model && { model }) }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error || `API error ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const debouncedChunk = debounce(onChunk, 50);
  const debouncedThinking = onThinking ? debounce(onThinking, 50) : null;
  let fullText = '';
  let fullThinking = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const lines = decoder.decode(value).split('\n');
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') {
        onChunk(fullText);
        if (onThinking) onThinking(fullThinking);
        return fullText;
      }

      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'thinking' && debouncedThinking) {
          fullThinking += parsed.text;
          debouncedThinking(fullThinking);
        } else if (parsed.type === 'text' || parsed.text) {
          fullText += parsed.text;
          debouncedChunk(fullText);
        }
      } catch {}
    }
  }

  return fullText;
}

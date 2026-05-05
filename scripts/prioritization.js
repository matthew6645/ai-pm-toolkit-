const PRIORITIZATION_SYSTEM_PROMPT = `You are a senior Product Manager expert in feature prioritization. Given a list of features and a strategic goal, evaluate each feature using the RICE framework (Reach, Impact, Confidence, Effort) and provide a prioritized ranking.

Return your response in markdown using this exact structure:

## Strategic Context
One sentence interpreting the goal and what it implies for prioritization.

## Prioritized Feature List

For each feature (ranked 1st to last), use this format:

### [Rank]. [Feature Name]
**RICE Score: [score]** | Reach: [H/M/L] | Impact: [H/M/L] | Confidence: [H/M/L] | Effort: [H/M/L]

[2-3 sentences of reasoning: why this rank, what trade-off it represents, any risk or dependency to flag]

---

## Summary
One paragraph summarizing the key trade-offs in this prioritization and any assumptions made.

Be opinionated and specific. A good prioritization has a clear rationale, not just scores.`;

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('pri-form');
  const submitBtn = document.getElementById('submit-btn');
  const outputPanel = document.getElementById('output');
  const copyBtn = document.getElementById('copy-btn');
  const thinkingToggle = document.getElementById('thinking-toggle');
  const thinkingCheckbox = document.getElementById('thinking-checkbox');
  const thinkingPanel = document.getElementById('thinking-panel');
  const thinkingHeader = document.getElementById('thinking-header');
  const thinkingBody = document.getElementById('thinking-body');
  let lastOutput = '';

  thinkingToggle.addEventListener('click', () => {
    thinkingCheckbox.checked = !thinkingCheckbox.checked;
    thinkingToggle.classList.toggle('active', thinkingCheckbox.checked);
  });

  thinkingHeader.addEventListener('click', () => {
    thinkingPanel.classList.toggle('collapsed');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const features = document.getElementById('features').value.trim();
    const goal = document.getElementById('goal').value.trim();
    const constraints = document.getElementById('constraints').value.trim();
    const thinking = thinkingCheckbox.checked;

    if (!features || !goal) return;

    submitBtn.disabled = true;
    submitBtn.textContent = thinking ? 'Thinking deeply…' : 'Analyzing…';
    outputPanel.className = 'output-panel loading';
    if (window.startThinking) window.startThinking(outputPanel);
    else outputPanel.innerHTML = '<div class="spinner"></div> Claude is thinking…';
    thinkingPanel.style.display = 'none';
    thinkingBody.textContent = '';
    thinkingPanel.classList.remove('collapsed');
    copyBtn.style.display = 'none';

    const userMessage = `Features to prioritize:\n${features}\n\nStrategic goal: ${goal}\n\nConstraints or context: ${constraints || 'none specified'}`;

    try {
      outputPanel.className = 'output-panel';
      const result = await callClaude(PRIORITIZATION_SYSTEM_PROMPT, userMessage, (partial) => {
        if (window.stopThinking) window.stopThinking(outputPanel);
        outputPanel.innerHTML = marked.parse(partial);
      }, {
        thinking,
        onThinking: thinking ? (partial) => {
          thinkingPanel.style.display = 'block';
          thinkingBody.textContent = partial;
        } : null,
      });
      lastOutput = result;
      copyBtn.style.display = 'inline-flex';
    } catch (err) {
      outputPanel.className = 'output-panel';
      outputPanel.innerHTML = `<div class="error-msg">Error: ${err.message}</div>`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Prioritize Features';
    }
  });

  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(lastOutput);
    if (window.flashCopied) window.flashCopied(copyBtn, 'Copy');
  });
});

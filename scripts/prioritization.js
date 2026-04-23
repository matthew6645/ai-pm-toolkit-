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
  let lastOutput = '';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const features = document.getElementById('features').value.trim();
    const goal = document.getElementById('goal').value.trim();
    const constraints = document.getElementById('constraints').value.trim();

    if (!features || !goal) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Analyzing…';
    outputPanel.className = 'output-panel loading';
    outputPanel.innerHTML = '<div class="spinner"></div> Claude is thinking…';

    const userMessage = `Features to prioritize:\n${features}\n\nStrategic goal: ${goal}\n\nConstraints or context: ${constraints || 'none specified'}`;

    try {
      const result = await callClaude(PRIORITIZATION_SYSTEM_PROMPT, userMessage);
      lastOutput = result;
      outputPanel.className = 'output-panel';
      outputPanel.innerHTML = marked.parse(result);
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
    copyBtn.textContent = 'Copied!';
    setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
  });
});

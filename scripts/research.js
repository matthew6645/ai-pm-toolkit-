const RESEARCH_SYSTEM_PROMPT = `You are a senior UX researcher and Product Manager. Given raw user interview notes or survey responses, synthesize the key findings into a structured research report.

Return your response in markdown using this exact structure:

## Key Themes
3-5 themes that emerged across multiple responses. For each theme:
**[Theme name]**: One sentence summary. Supported by: brief list of evidence from the notes.

## Top Pain Points
Ranked list of 3-5 pain points, from most to least frequently mentioned. For each:
- **[Pain point]** — [how many / which users mentioned it, and in what context]

## Opportunity Areas
2-4 product opportunities directly implied by the research. For each:
**[Opportunity]**: What the user need is, and what kind of solution could address it.

## Quotes Worth Keeping
2-3 direct or paraphrased quotes that best capture user sentiment.

## Research Gaps
1-3 questions that remain unanswered and would need follow-up research.

Be analytical, not just descriptive. Identify patterns, not just summaries.`;

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('research-form');
  const submitBtn = document.getElementById('submit-btn');
  const outputPanel = document.getElementById('output');
  const copyBtn = document.getElementById('copy-btn');
  let lastOutput = '';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const notes = document.getElementById('notes').value.trim();
    const context = document.getElementById('context').value.trim();

    if (!notes) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Synthesizing…';
    outputPanel.className = 'output-panel loading';
    outputPanel.innerHTML = '<div class="spinner"></div> Claude is thinking…';

    const userMessage = `Research context: ${context || 'not specified'}\n\nRaw notes / responses:\n${notes}`;

    try {
      const result = await callClaude(RESEARCH_SYSTEM_PROMPT, userMessage);
      lastOutput = result;
      outputPanel.className = 'output-panel';
      outputPanel.innerHTML = marked.parse(result);
      copyBtn.style.display = 'inline-flex';
    } catch (err) {
      outputPanel.className = 'output-panel';
      outputPanel.innerHTML = `<div class="error-msg">Error: ${err.message}. Check your API key in config.js.</div>`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Synthesize Research';
    }
  });

  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(lastOutput);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
  });
});

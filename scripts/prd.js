const PRD_SYSTEM_PROMPT = `You are a senior Product Manager. Given a feature idea, write a concise but complete PRD in markdown format using this exact structure:

## Problem Statement
One paragraph explaining the user problem being solved.

## Goals
Bullet list of 2-4 measurable goals.

## Non-Goals
Bullet list of 2-3 explicit out-of-scope items.

## User Stories
3-4 user stories in "As a [user], I want to [action] so that [benefit]" format.

## Success Metrics
2-3 specific, measurable metrics with targets.

## Open Questions
2-3 questions that need answers before or during implementation.

Be concise and specific. Avoid filler. Write as a real PM would, not as a template exercise.`;

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('prd-form');
  const submitBtn = document.getElementById('submit-btn');
  const outputPanel = document.getElementById('output');
  const copyBtn = document.getElementById('copy-btn');
  let lastOutput = '';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const idea = document.getElementById('idea').value.trim();
    const users = document.getElementById('users').value.trim();
    const metrics = document.getElementById('metrics').value.trim();

    if (!idea) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Generating…';
    outputPanel.className = 'output-panel loading';
    outputPanel.innerHTML = '<div class="spinner"></div> Claude is thinking…';

    const userMessage = `Feature idea: ${idea}\nTarget users: ${users || 'not specified'}\nDesired outcome / success signal: ${metrics || 'not specified'}`;

    try {
      const result = await callClaude(PRD_SYSTEM_PROMPT, userMessage);
      lastOutput = result;
      outputPanel.className = 'output-panel';
      outputPanel.innerHTML = marked.parse(result);
      copyBtn.style.display = 'inline-flex';
    } catch (err) {
      outputPanel.className = 'output-panel';
      outputPanel.innerHTML = `<div class="error-msg">Error: ${err.message}. Check your API key in config.js.</div>`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Generate PRD';
    }
  });

  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(lastOutput);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
  });
});

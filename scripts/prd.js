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
    const idea = document.getElementById('idea').value.trim();
    const users = document.getElementById('users').value.trim();
    const metrics = document.getElementById('metrics').value.trim();
    const thinking = thinkingCheckbox.checked;

    if (!idea) return;

    submitBtn.disabled = true;
    submitBtn.textContent = thinking ? 'Thinking deeply…' : 'Generating…';
    outputPanel.className = 'output-panel loading';
    if (window.startThinking) window.startThinking(outputPanel);
    else outputPanel.innerHTML = '<div class="spinner"></div> Claude is thinking…';
    thinkingPanel.style.display = 'none';
    thinkingBody.textContent = '';
    thinkingPanel.classList.remove('collapsed');
    copyBtn.style.display = 'none';

    const userMessage = `Feature idea: ${idea}\nTarget users: ${users || 'not specified'}\nDesired outcome / success signal: ${metrics || 'not specified'}`;

    try {
      outputPanel.className = 'output-panel';
      const result = await callClaude(PRD_SYSTEM_PROMPT, userMessage, (partial) => {
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
      submitBtn.textContent = 'Generate PRD';
    }
  });

  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(lastOutput);
    if (window.flashCopied) window.flashCopied(copyBtn, 'Copy');
  });
});

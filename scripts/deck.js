// ── Constants ────────────────────────────────────────────────────────────────

const DECK_SYSTEM_PROMPT = `You are a McKinsey partner building a high-stakes executive presentation. You follow the Pyramid Principle — every slide leads with the conclusion, not the topic.

Return ONLY a valid JSON object with no markdown fencing, no preamble, no trailing text. Use this exact schema:

{
  "deck_title": "string",
  "slides": [
    {
      "type": "title",
      "title": "string",
      "subtitle": "string",
      "presenter": "string"
    },
    {
      "type": "exec_summary",
      "title": "string",
      "key_message": "string",
      "bullets": ["string", "string", "string"]
    },
    {
      "type": "content",
      "title": "string",
      "key_message": "string",
      "bullets": ["string", "string", "string"]
    },
    {
      "type": "next_steps",
      "title": "string",
      "key_message": "string",
      "actions": [
        { "action": "string", "owner": "string", "timeline": "string" }
      ]
    }
  ]
}

Strict rules:
1. Slide titles state CONCLUSIONS, never topics. Bad: "Revenue Analysis". Good: "Revenue will miss plan by 23% without intervention in Q3".
2. key_message is the single "so what" sentence — the one thing to remember if nothing else lands.
3. Bullets are evidence that prove the title's assertion — data points, findings, benchmarks. Be specific and quantitative.
4. The first slide must be type "title". The second must be type "exec_summary". The last must be type "next_steps". All others are type "content".
5. Actions in next_steps must have concrete owners (role, not name) and specific timelines.
6. Write with the directness and confidence of a partner who has done this analysis. No hedging, no filler.
7. Use the data and context the user provides. Invent plausible specifics only where the user has left gaps.`;

// ── State ────────────────────────────────────────────────────────────────────

let currentDeck = null;
let currentSlide = 0;
let selectedCount = 7;

// ── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Slide count selector
  document.querySelectorAll('.slide-count-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.slide-count-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedCount = parseInt(btn.dataset.count);
    });
  });

  // Thinking toggle
  const thinkingToggle = document.getElementById('thinking-toggle');
  const thinkingCheckbox = document.getElementById('thinking-checkbox');
  thinkingToggle.classList.add('active'); // default on
  thinkingToggle.addEventListener('click', () => {
    thinkingCheckbox.checked = !thinkingCheckbox.checked;
    thinkingToggle.classList.toggle('active', thinkingCheckbox.checked);
  });

  // Thinking panel collapse
  document.getElementById('thinking-header').addEventListener('click', () => {
    document.getElementById('thinking-panel').classList.toggle('collapsed');
  });

  // Navigation
  document.getElementById('prev-btn').addEventListener('click', () => navigate(-1));
  document.getElementById('next-btn').addEventListener('click', () => navigate(1));

  // Form submit
  document.getElementById('deck-form').addEventListener('submit', handleSubmit);

  // Export
  document.getElementById('export-btn').addEventListener('click', exportPptx);
  document.getElementById('rebuild-btn').addEventListener('click', () => {
    showState('empty');
    document.getElementById('export-bar').classList.remove('visible');
    currentDeck = null;
  });
});

// ── Form handler ─────────────────────────────────────────────────────────────

async function handleSubmit(e) {
  e.preventDefault();

  const situation = document.getElementById('situation').value.trim();
  const objective = document.getElementById('objective').value.trim();
  const audience = document.getElementById('audience').value.trim();
  const data = document.getElementById('data').value.trim();
  const thinking = document.getElementById('thinking-checkbox').checked;

  const userMessage = `Build a ${selectedCount}-slide executive deck.

Situation: ${situation}
Objective: ${objective}
Audience: ${audience || 'Senior leadership team'}
Key data / evidence: ${data || 'Use reasonable estimates based on the situation.'}

Produce exactly ${selectedCount} slides following the schema. Remember: titles must state conclusions, not topics.`;

  showState('generating');
  document.getElementById('gen-status').textContent = 'Claude is structuring your deck…';
  document.getElementById('export-bar').classList.remove('visible');

  const thinkingPanel = document.getElementById('thinking-panel');
  const thinkingBody = document.getElementById('thinking-body');
  thinkingPanel.style.display = 'none';
  thinkingBody.textContent = '';
  thinkingPanel.classList.remove('collapsed');

  try {
    let charCount = 0;
    const rawText = await callClaude(DECK_SYSTEM_PROMPT, userMessage, (partial) => {
      charCount = partial.length;
      document.getElementById('gen-status').textContent = `Structuring slides… (${charCount} chars)`;
    }, {
      thinking,
      onThinking: thinking ? (partial) => {
        thinkingPanel.style.display = 'block';
        thinkingBody.textContent = partial;
      } : null,
    });

    const deck = parseJSON(rawText);
    currentDeck = deck;
    currentSlide = 0;

    renderViewer(deck);
    showState('viewer');
    document.getElementById('export-bar').classList.add('visible');

  } catch (err) {
    showState('empty');
    document.getElementById('preview-empty').innerHTML = `
      <div class="preview-empty-icon">⚠️</div>
      <div style="color:#b91c1c">Error: ${err.message}</div>
      <div style="font-size:0.78rem">Check your inputs and try again.</div>`;
  }
}

// ── JSON parser (strips markdown fences if present) ──────────────────────────

function parseJSON(raw) {
  let text = raw.trim();
  // Strip markdown code fences
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  try {
    return JSON.parse(text);
  } catch {
    // Try to find JSON object within the text
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error('Claude returned invalid JSON. Try again.');
  }
}

// ── State manager ─────────────────────────────────────────────────────────────

function showState(state) {
  document.getElementById('preview-empty').style.display = state === 'empty' ? 'flex' : 'none';
  document.getElementById('generating-state').style.display = state === 'generating' ? 'flex' : 'none';
  document.getElementById('slide-viewer').classList.toggle('visible', state === 'viewer');
}

// ── Slide renderer ────────────────────────────────────────────────────────────

function renderViewer(deck) {
  const slides = deck.slides;
  renderSlide(slides, currentSlide);
  renderThumbs(slides);
  updateNav(slides);
}

function navigate(dir) {
  const slides = currentDeck.slides;
  currentSlide = Math.max(0, Math.min(slides.length - 1, currentSlide + dir));
  renderSlide(slides, currentSlide);
  updateNav(slides);
  document.querySelectorAll('.slide-thumb').forEach((t, i) => t.classList.toggle('active', i === currentSlide));
}

function updateNav(slides) {
  document.getElementById('prev-btn').disabled = currentSlide === 0;
  document.getElementById('next-btn').disabled = currentSlide === slides.length - 1;
  document.getElementById('slide-counter').textContent = `Slide ${currentSlide + 1} of ${slides.length}`;
}

function renderSlide(slides, idx) {
  const slide = slides[idx];
  const canvas = document.getElementById('slide-canvas');
  canvas.innerHTML = buildSlideHTML(slide, idx + 1, slides.length);
}

function renderThumbs(slides) {
  const container = document.getElementById('slide-thumbs');
  container.innerHTML = slides.map((s, i) => `
    <div class="slide-thumb ${i === 0 ? 'active' : ''}" data-idx="${i}" title="Slide ${i + 1}">
      <div style="width:100%;height:100%;transform:scale(0.155);transform-origin:top left;width:${100/0.155}%;height:${100/0.155}%;">
        ${buildSlideHTML(s, i + 1, slides.length)}
      </div>
    </div>`).join('');

  document.querySelectorAll('.slide-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      currentSlide = parseInt(thumb.dataset.idx);
      renderSlide(slides, currentSlide);
      updateNav(slides);
      document.querySelectorAll('.slide-thumb').forEach((t, i) => t.classList.toggle('active', i === currentSlide));
    });
  });
}

function buildSlideHTML(slide, num, total) {
  const numBadge = `<div class="slide-number">${num} / ${total}</div>`;

  if (slide.type === 'title') {
    return `<div class="slide slide-title-type">
      <div class="slide-title-eyebrow">Executive Presentation</div>
      <div class="slide-title-heading">${esc(slide.title)}</div>
      <div class="slide-title-sub">${esc(slide.subtitle || '')}</div>
      <div class="slide-title-meta">${esc(slide.presenter || '')} · Confidential</div>
      ${numBadge}
    </div>`;
  }

  if (slide.type === 'next_steps') {
    const actions = (slide.actions || []).map(a => `
      <div class="action-item">
        <div class="action-text">${esc(a.action)}</div>
        <span class="action-tag owner">${esc(a.owner)}</span>
        <span class="action-tag timeline">${esc(a.timeline)}</span>
      </div>`).join('');

    return `<div class="slide" style="position:relative;">
      <div class="slide-header"><div class="slide-header-title">${esc(slide.title)}</div></div>
      <div class="slide-body">
        <div class="slide-keymsg">${esc(slide.key_message || '')}</div>
        <div class="actions-grid" style="grid-template-rows:repeat(${(slide.actions||[]).length}, 1fr);">${actions}</div>
      </div>
      ${numBadge}
    </div>`;
  }

  // exec_summary + content
  const bullets = (slide.bullets || []).map(b => `<li>${esc(b)}</li>`).join('');
  return `<div class="slide" style="position:relative;">
    <div class="slide-header"><div class="slide-header-title">${esc(slide.title)}</div></div>
    <div class="slide-body">
      ${slide.key_message ? `<div class="slide-keymsg">${esc(slide.key_message)}</div>` : ''}
      <ul class="slide-bullets">${bullets}</ul>
    </div>
    ${numBadge}
  </div>`;
}

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── PPTX Export ───────────────────────────────────────────────────────────────

async function exportPptx() {
  const btn = document.getElementById('export-btn');
  btn.textContent = 'Building…';
  btn.disabled = true;

  try {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE'; // 13.33" x 7.5"

    const NAVY   = '002147';
    const WHITE  = 'FFFFFF';
    const BLUE   = '0078D4';
    const LGRAY  = 'F1F5F9';
    const MGRAY  = 'E2E8F0';
    const DGRAY  = '334155';
    const ACCENT = '00C4FF';

    currentDeck.slides.forEach((slide, idx) => {

      const s = pptx.addSlide();

      // ── Title slide ──────────────────────────────────────────────────────
      if (slide.type === 'title') {
        s.background = { color: NAVY };

        // Accent bar at bottom
        s.addShape(pptx.ShapeType.rect, { x: 0, y: 7.3, w: 13.33, h: 0.07, fill: { type: 'gradient', stops: [{ position: 0, color: BLUE }, { position: 100, color: ACCENT }] } });

        // Decorative circle
        s.addShape(pptx.ShapeType.ellipse, { x: 10.5, y: -1.2, w: 3.5, h: 3.5, fill: { color: '0D3A6B' }, line: { color: '0D3A6B' } });

        s.addText('EXECUTIVE PRESENTATION · CONFIDENTIAL', {
          x: 1, y: 1.8, w: 10, h: 0.3,
          fontSize: 8, color: '4D8AB5', bold: true, charSpacing: 3,
        });
        s.addText(slide.title, {
          x: 1, y: 2.3, w: 10, h: 2.2,
          fontSize: 32, color: WHITE, bold: true, breakLine: true,
        });
        if (slide.subtitle) {
          s.addText(slide.subtitle, {
            x: 1, y: 4.6, w: 9, h: 0.8,
            fontSize: 14, color: '7AB3D4', breakLine: true,
          });
        }
        s.addText((slide.presenter || 'Prepared by Product') + '  ·  ' + new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }), {
          x: 1, y: 6.8, w: 10, h: 0.3,
          fontSize: 9, color: '4D7A9A',
        });
        s.addText(String(idx + 1), { x: 12.8, y: 7.1, w: 0.4, h: 0.25, fontSize: 8, color: '3A6A8A', align: 'right' });
        return;
      }

      // ── Shared: header bar ───────────────────────────────────────────────
      s.background = { color: WHITE };
      s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 1.15, fill: { color: NAVY } });
      s.addText(slide.title, {
        x: 0.35, y: 0.1, w: 12.4, h: 0.95,
        fontSize: 16, color: WHITE, bold: true, valign: 'middle', breakLine: true,
      });

      // Slide number
      s.addText(`${idx + 1} / ${currentDeck.slides.length}`, {
        x: 12.6, y: 7.2, w: 0.6, h: 0.2, fontSize: 7, color: 'CBD5E1', align: 'right',
      });

      // ── Next steps ───────────────────────────────────────────────────────
      if (slide.type === 'next_steps') {
        if (slide.key_message) {
          s.addShape(pptx.ShapeType.rect, { x: 0.35, y: 1.3, w: 12.6, h: 0.55, fill: { color: 'EEF4FB' } });
          s.addShape(pptx.ShapeType.rect, { x: 0.35, y: 1.3, w: 0.06, h: 0.55, fill: { color: BLUE } });
          s.addText(slide.key_message, {
            x: 0.55, y: 1.3, w: 12.3, h: 0.55,
            fontSize: 11, color: NAVY, bold: true, valign: 'middle', breakLine: true,
          });
        }

        const actions = slide.actions || [];
        const rowH = Math.min(0.75, (7.5 - 2.1) / Math.max(actions.length, 1));
        actions.forEach((action, i) => {
          const y = 2.05 + i * (rowH + 0.08);
          s.addShape(pptx.ShapeType.rect, { x: 0.35, y, w: 12.6, h: rowH, fill: { color: i % 2 === 0 ? 'F8FAFC' : WHITE }, line: { color: MGRAY, pt: 1 } });
          s.addText(action.action, { x: 0.5, y: y + 0.05, w: 8.5, h: rowH - 0.1, fontSize: 10, color: DGRAY, valign: 'middle', breakLine: true });
          s.addShape(pptx.ShapeType.roundRect, { x: 9.1, y: y + (rowH - 0.3) / 2, w: 1.6, h: 0.3, rectRadius: 0.15, fill: { color: 'EEF4FB' } });
          s.addText(action.owner, { x: 9.1, y: y + (rowH - 0.3) / 2, w: 1.6, h: 0.3, fontSize: 8, color: BLUE, bold: true, align: 'center', valign: 'middle' });
          s.addShape(pptx.ShapeType.roundRect, { x: 10.85, y: y + (rowH - 0.3) / 2, w: 2.1, h: 0.3, rectRadius: 0.15, fill: { color: 'F0FDF4' } });
          s.addText(action.timeline, { x: 10.85, y: y + (rowH - 0.3) / 2, w: 2.1, h: 0.3, fontSize: 8, color: '166534', bold: true, align: 'center', valign: 'middle' });
        });
        return;
      }

      // ── Exec summary + content ───────────────────────────────────────────
      let yPos = 1.3;

      if (slide.key_message) {
        s.addShape(pptx.ShapeType.rect, { x: 0.35, y: yPos, w: 12.6, h: 0.65, fill: { color: 'EEF4FB' } });
        s.addShape(pptx.ShapeType.rect, { x: 0.35, y: yPos, w: 0.06, h: 0.65, fill: { color: BLUE } });
        s.addText(slide.key_message, {
          x: 0.55, y: yPos, w: 12.3, h: 0.65,
          fontSize: 12, color: NAVY, bold: true, valign: 'middle', breakLine: true,
        });
        yPos += 0.8;
      }

      const bullets = slide.bullets || [];
      const bH = Math.min(0.8, (7.3 - yPos) / Math.max(bullets.length, 1));
      bullets.forEach((bullet, i) => {
        s.addShape(pptx.ShapeType.rect, { x: 0.35, y: yPos + i * (bH + 0.06), w: 12.6, h: bH, fill: { color: i % 2 === 0 ? 'FAFBFC' : WHITE }, line: { color: MGRAY, pt: 0.5 } });
        // Arrow marker
        s.addShape(pptx.ShapeType.rect, { x: 0.35, y: yPos + i * (bH + 0.06), w: 0.25, h: bH, fill: { color: i % 2 === 0 ? 'E8F0FB' : 'F0F4FA' } });
        s.addText('▸', { x: 0.35, y: yPos + i * (bH + 0.06), w: 0.25, h: bH, fontSize: 9, color: BLUE, align: 'center', valign: 'middle' });
        s.addText(bullet, {
          x: 0.72, y: yPos + i * (bH + 0.06) + 0.05, w: 12.1, h: bH - 0.1,
          fontSize: 10, color: DGRAY, valign: 'middle', breakLine: true,
        });
      });
    });

    await pptx.writeFile({ fileName: `${slugify(currentDeck.deck_title || 'deck')}.pptx` });

  } catch (err) {
    alert('Export failed: ' + err.message);
  } finally {
    btn.textContent = 'Download .pptx';
    btn.disabled = false;
  }
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
}

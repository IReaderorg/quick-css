/**
 * IReader Selector Helper v4.0
 * Simple drag-to-select CSS selector finder
 * 
 * Flow:
 * 1. Click extension icon → activates selection mode
 * 2. Drag to select area on page
 * 3. Panel shows all selectors found in selection
 * 4. Filter, preview, and copy selectors
 */

(function() {
  'use strict';

  // Prevent double-loading
  if (window.IReaderSelector) {
    window.IReaderSelector.activate();
    return;
  }

  // ═══════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════

  const state = {
    active: false,
    selecting: false,
    startX: 0,
    startY: 0,
    elements: {
      overlay: null,
      selectionBox: null,
      banner: null,
      panel: null,
      toast: null
    },
    results: [],
    filteredResults: [],
    searchQuery: '',
    activeHint: null,
    highlightedElements: []
  };

  // Field hints for IReader sources
  const FIELD_HINTS = [
    { id: 'title', label: 'Title', keywords: ['title', 'name', 'heading', 'h1', 'h2', 'h3'] },
    { id: 'author', label: 'Author', keywords: ['author', 'writer', 'creator'] },
    { id: 'cover', label: 'Cover', keywords: ['cover', 'img', 'image', 'thumbnail', 'poster'] },
    { id: 'desc', label: 'Description', keywords: ['desc', 'synopsis', 'summary', 'about'] },
    { id: 'chapter', label: 'Chapter', keywords: ['chapter', 'chap', 'episode', 'ch-'] },
    { id: 'content', label: 'Content', keywords: ['content', 'text', 'reading', 'body'] },
    { id: 'link', label: 'Link', keywords: ['link', 'href', 'url', 'a[href]'] },
    { id: 'status', label: 'Status', keywords: ['status', 'ongoing', 'complete'] },
    { id: 'genre', label: 'Genre', keywords: ['genre', 'tag', 'category'] }
  ];

  // ═══════════════════════════════════════════════════════════════
  // MAIN API
  // ═══════════════════════════════════════════════════════════════

  window.IReaderSelector = {
    activate() {
      if (state.active) return;
      state.active = true;
      bypassPageLocks();
      createBanner();
      createOverlay();
      console.log('[IReader] Selection mode activated');
    },

    deactivate() {
      cleanup();
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // BYPASS PAGE LOCKS
  // ═══════════════════════════════════════════════════════════════

  function bypassPageLocks() {
    // Remove common blockers
    const style = document.createElement('style');
    style.id = 'ireader-unlock';
    style.textContent = `
      * {
        -webkit-user-select: auto !important;
        user-select: auto !important;
      }
    `;
    document.head.appendChild(style);

    // Prevent default handlers during selection
    document.addEventListener('contextmenu', stopEvent, true);
    document.addEventListener('selectstart', stopEvent, true);
  }

  function stopEvent(e) {
    if (state.active) {
      e.stopPropagation();
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // UI CREATION
  // ═══════════════════════════════════════════════════════════════

  function createBanner() {
    const banner = document.createElement('div');
    banner.id = 'ireader-banner';
    banner.innerHTML = `
      <div>
        <h3>🎯 IReader Selector Helper</h3>
        <p>Drag to select an area, or click on an element to analyze it</p>
      </div>
      <button id="ireader-cancel">Cancel (ESC)</button>
    `;
    document.body.appendChild(banner);
    state.elements.banner = banner;

    document.getElementById('ireader-cancel').onclick = cleanup;
    document.addEventListener('keydown', handleKeyDown);
  }

  function createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'ireader-overlay';
    document.body.appendChild(overlay);
    state.elements.overlay = overlay;

    overlay.addEventListener('mousedown', startSelection);
    overlay.addEventListener('mousemove', updateSelection);
    overlay.addEventListener('mouseup', endSelection);
    
    // Also support click-to-select single element
    overlay.addEventListener('click', handleClick);
  }

  function handleClick(e) {
    // If user just clicked without dragging, select element under cursor
    if (!state.selecting && state.elements.selectionBox === null) {
      // Temporarily hide overlay to get element underneath
      state.elements.overlay.style.pointerEvents = 'none';
      const elementUnder = document.elementFromPoint(e.clientX, e.clientY);
      state.elements.overlay.style.pointerEvents = 'auto';
      
      if (elementUnder && !elementUnder.id?.startsWith('ireader-')) {
        // Find a reasonable container (not too small, not body)
        let target = elementUnder;
        const rect = target.getBoundingClientRect();
        
        // If element is very small, try parent
        if (rect.width < 50 || rect.height < 30) {
          if (target.parentElement && target.parentElement !== document.body) {
            target = target.parentElement;
          }
        }
        
        // Analyze this element and its children
        const elements = [target, ...target.querySelectorAll('*')].slice(0, 100);
        
        // Remove overlay
        if (state.elements.overlay) {
          state.elements.overlay.remove();
          state.elements.overlay = null;
        }
        
        analyzeElements(elements);
        showResultsPanel();
      }
    }
  }

  function createSelectionBox() {
    const box = document.createElement('div');
    box.id = 'ireader-selection-box';
    document.body.appendChild(box);
    state.elements.selectionBox = box;
  }

  // ═══════════════════════════════════════════════════════════════
  // SELECTION HANDLING
  // ═══════════════════════════════════════════════════════════════

  function startSelection(e) {
    state.selecting = true;
    state.startX = e.clientX;
    state.startY = e.clientY;
    createSelectionBox();
  }

  function updateSelection(e) {
    if (!state.selecting || !state.elements.selectionBox) return;

    const box = state.elements.selectionBox;
    const x = Math.min(e.clientX, state.startX);
    const y = Math.min(e.clientY, state.startY);
    const w = Math.abs(e.clientX - state.startX);
    const h = Math.abs(e.clientY - state.startY);

    box.style.left = x + 'px';
    box.style.top = y + 'px';
    box.style.width = w + 'px';
    box.style.height = h + 'px';
  }

  function endSelection(e) {
    if (!state.selecting) return;
    state.selecting = false;

    const rect = {
      left: Math.min(e.clientX, state.startX),
      top: Math.min(e.clientY, state.startY),
      right: Math.max(e.clientX, state.startX),
      bottom: Math.max(e.clientY, state.startY)
    };

    // Minimum selection size
    if (rect.right - rect.left < 20 || rect.bottom - rect.top < 20) {
      if (state.elements.selectionBox) {
        state.elements.selectionBox.remove();
        state.elements.selectionBox = null;
      }
      return;
    }

    // Find elements in selection
    const elements = findElementsInRect(rect);
    
    // Remove overlay and selection box
    if (state.elements.overlay) {
      state.elements.overlay.remove();
      state.elements.overlay = null;
    }
    if (state.elements.selectionBox) {
      state.elements.selectionBox.remove();
      state.elements.selectionBox = null;
    }

    // Analyze and show results
    if (elements.length > 0) {
      analyzeElements(elements);
      showResultsPanel();
    } else {
      showToast('No elements found in selection', 'warn');
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ELEMENT FINDING & ANALYSIS
  // ═══════════════════════════════════════════════════════════════

  function findElementsInRect(rect) {
    const elements = new Set();
    
    // Get all elements and check if they're in the selection
    const allElements = document.querySelectorAll('*');
    
    for (const el of allElements) {
      // Skip our own elements and scripts/styles
      if (el.id?.startsWith('ireader-') || 
          el.tagName === 'SCRIPT' || 
          el.tagName === 'STYLE' ||
          el.tagName === 'NOSCRIPT') {
        continue;
      }

      const elRect = el.getBoundingClientRect();
      
      // Check if element overlaps with selection
      if (elRect.left < rect.right && 
          elRect.right > rect.left && 
          elRect.top < rect.bottom && 
          elRect.bottom > rect.top &&
          elRect.width > 0 && 
          elRect.height > 0) {
        elements.add(el);
      }
    }

    return Array.from(elements);
  }

  function analyzeElements(elements) {
    const selectorMap = new Map();

    for (const el of elements) {
      const selectors = generateSelectorsForElement(el);
      
      for (const sel of selectors) {
        if (!selectorMap.has(sel.selector)) {
          selectorMap.set(sel.selector, {
            selector: sel.selector,
            type: sel.type,
            element: el,
            matchCount: 0,
            textPreview: '',
            attrPreview: '',
            score: 0
          });
        }
      }
    }

    // Calculate match counts and previews
    for (const [selector, data] of selectorMap) {
      try {
        const matches = document.querySelectorAll(selector);
        data.matchCount = matches.length;
        
        if (matches.length > 0) {
          const first = matches[0];
          data.textPreview = getTextPreview(first);
          data.attrPreview = getAttrPreview(first);
          data.score = calculateScore(data, first);
        }
      } catch (e) {
        // Invalid selector
        selectorMap.delete(selector);
      }
    }

    // Convert to array and sort by score
    state.results = Array.from(selectorMap.values())
      .filter(r => r.matchCount > 0)
      .sort((a, b) => b.score - a.score);

    state.filteredResults = [...state.results];
  }

  function generateSelectorsForElement(el) {
    const selectors = [];
    const tag = el.tagName.toLowerCase();

    // ID selector (if not generated)
    if (el.id && !isGeneratedId(el.id)) {
      selectors.push({ selector: '#' + CSS.escape(el.id), type: 'id' });
    }

    // Class selectors
    if (el.classList.length > 0) {
      for (const cls of el.classList) {
        if (isValidClass(cls)) {
          selectors.push({ selector: '.' + CSS.escape(cls), type: 'class' });
          selectors.push({ selector: tag + '.' + CSS.escape(cls), type: 'tag+class' });
        }
      }
    }

    // Tag selector
    selectors.push({ selector: tag, type: 'tag' });

    // Attribute selectors for useful attributes
    const attrs = ['data-id', 'data-type', 'role', 'itemprop', 'name'];
    for (const attr of attrs) {
      const val = el.getAttribute(attr);
      if (val && val.length < 50) {
        selectors.push({ 
          selector: `[${attr}="${CSS.escape(val)}"]`, 
          type: 'attr' 
        });
      }
    }

    // Parent + child combinations (limited)
    const parent = el.parentElement;
    if (parent && parent !== document.body) {
      const parentSel = getSimpleSelector(parent);
      if (parentSel) {
        selectors.push({ 
          selector: parentSel + ' ' + tag, 
          type: 'parent+tag' 
        });
        
        if (el.classList.length > 0) {
          const cls = Array.from(el.classList).find(c => isValidClass(c));
          if (cls) {
            selectors.push({ 
              selector: parentSel + ' .' + CSS.escape(cls), 
              type: 'parent+class' 
            });
          }
        }
      }
    }

    return selectors;
  }

  function getSimpleSelector(el) {
    if (el.id && !isGeneratedId(el.id)) {
      return '#' + CSS.escape(el.id);
    }
    
    if (el.classList.length > 0) {
      const cls = Array.from(el.classList).find(c => isValidClass(c));
      if (cls) return '.' + CSS.escape(cls);
    }
    
    return el.tagName.toLowerCase();
  }

  function isGeneratedId(id) {
    return /^[a-f0-9]{8,}$/i.test(id) || 
           /^(ember|react-|ng-|vue-|:r|_)\d*/i.test(id) ||
           /^\d+$/.test(id);
  }

  function isValidClass(cls) {
    return cls.length > 1 && 
           cls.length < 50 &&
           !/^(hover|focus|active|sm:|md:|lg:|xl:|2xl:)/.test(cls) &&
           !/[\/\[\]:@{}]/.test(cls) &&
           !/^[a-f0-9]{8,}$/i.test(cls);
  }

  function getTextPreview(el) {
    const text = el.innerText?.trim() || '';
    return text.substring(0, 150);
  }

  function getAttrPreview(el) {
    const attrs = [];
    if (el.href) attrs.push('href: ' + el.href.substring(0, 60));
    if (el.src) attrs.push('src: ' + el.src.substring(0, 60));
    if (el.getAttribute('data-src')) attrs.push('data-src: ' + el.getAttribute('data-src').substring(0, 60));
    return attrs.join(' | ');
  }

  function calculateScore(data, el) {
    let score = 0;
    
    // Prefer unique selectors
    if (data.matchCount === 1) score += 50;
    else if (data.matchCount <= 5) score += 30;
    else if (data.matchCount <= 20) score += 10;
    
    // Prefer shorter selectors
    score += Math.max(0, 30 - data.selector.length);
    
    // Prefer class and ID selectors
    if (data.type === 'id') score += 40;
    if (data.type === 'class') score += 25;
    if (data.type === 'tag+class') score += 20;
    
    // Bonus for semantic classes
    const semanticKeywords = ['title', 'author', 'cover', 'content', 'chapter', 'desc', 'name', 'image'];
    for (const kw of semanticKeywords) {
      if (data.selector.toLowerCase().includes(kw)) {
        score += 15;
        break;
      }
    }
    
    // Bonus for elements with useful content
    if (el.tagName === 'IMG' || el.tagName === 'A') score += 10;
    if (data.textPreview.length > 10) score += 5;
    
    return score;
  }

  // ═══════════════════════════════════════════════════════════════
  // RESULTS PANEL
  // ═══════════════════════════════════════════════════════════════

  function showResultsPanel() {
    const panel = document.createElement('div');
    panel.id = 'ireader-panel';
    panel.innerHTML = `
      <div id="ireader-panel-header">
        <h3>Found Selectors</h3>
        <button id="ireader-panel-close">✕</button>
      </div>
      <div id="ireader-search-container">
        <input type="text" id="ireader-search" placeholder="Search selectors... (e.g. title, .class, img)">
      </div>
      <div id="ireader-hints"></div>
      <div id="ireader-results"></div>
      <div id="ireader-stats"></div>
      <div id="ireader-footer">
        <button id="ireader-select-again">🎯 Select Again</button>
        <button id="ireader-export">📥 Export All</button>
      </div>
    `;
    document.body.appendChild(panel);
    state.elements.panel = panel;

    // Setup event handlers
    document.getElementById('ireader-panel-close').onclick = cleanup;
    document.getElementById('ireader-search').oninput = (e) => {
      state.searchQuery = e.target.value.toLowerCase();
      filterResults();
    };
    document.getElementById('ireader-select-again').onclick = selectAgain;
    document.getElementById('ireader-export').onclick = exportSelectors;

    // Render hints
    renderHints();
    
    // Render quick copy (top recommended)
    renderQuickCopy();
    
    // Render results
    renderResults();
    updateStats();
  }

  function renderQuickCopy() {
    // Get top 5 unique selectors
    const topSelectors = state.results
      .filter(r => r.matchCount === 1 && r.score >= 40)
      .slice(0, 5);

    if (topSelectors.length === 0) return;

    const container = document.createElement('div');
    container.id = 'ireader-quickcopy';
    container.innerHTML = `
      <div id="ireader-quickcopy-label">⚡ Quick Copy (Best Matches)</div>
      <div id="ireader-quickcopy-items">
        ${topSelectors.map(r => `
          <div class="ireader-quickcopy-item" data-selector="${escapeHtml(r.selector)}" title="${escapeHtml(r.textPreview || r.selector)}">
            <span class="ireader-qc-icon">✓</span>
            <span class="ireader-qc-selector">${escapeHtml(r.selector)}</span>
          </div>
        `).join('')}
      </div>
    `;

    // Insert after hints
    const hints = document.getElementById('ireader-hints');
    hints.parentNode.insertBefore(container, hints.nextSibling);

    // Add click handlers
    container.querySelectorAll('.ireader-quickcopy-item').forEach(item => {
      item.onclick = () => {
        const selector = item.dataset.selector;
        navigator.clipboard.writeText(selector).then(() => {
          item.classList.add('copied');
          showToast('Copied: ' + selector);
          setTimeout(() => item.classList.remove('copied'), 1500);
        });
      };
    });
  }

  function selectAgain() {
    // Keep panel but restart selection
    if (state.elements.panel) {
      state.elements.panel.style.display = 'none';
    }
    
    // Update banner
    if (state.elements.banner) {
      state.elements.banner.querySelector('p').textContent = 
        'Drag to select another area. Previous results will be replaced.';
    }
    
    createOverlay();
  }

  function exportSelectors() {
    const data = state.filteredResults.map(r => ({
      selector: r.selector,
      type: r.type,
      matches: r.matchCount,
      preview: r.textPreview.substring(0, 100)
    }));

    const text = JSON.stringify(data, null, 2);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ireader-selectors.json';
    a.click();
    
    URL.revokeObjectURL(url);
    showToast('Exported ' + data.length + ' selectors');
  }

  function renderHints() {
    const container = document.getElementById('ireader-hints');
    container.innerHTML = FIELD_HINTS.map(hint => 
      `<button class="ireader-hint" data-hint="${hint.id}">${hint.label}</button>`
    ).join('');

    container.querySelectorAll('.ireader-hint').forEach(btn => {
      btn.onclick = () => {
        const hintId = btn.dataset.hint;
        
        // Toggle hint
        if (state.activeHint === hintId) {
          state.activeHint = null;
          btn.classList.remove('active');
        } else {
          container.querySelectorAll('.ireader-hint').forEach(b => b.classList.remove('active'));
          state.activeHint = hintId;
          btn.classList.add('active');
        }
        
        filterResults();
      };
    });
  }

  function filterResults() {
    let results = [...state.results];

    // Filter by search query
    if (state.searchQuery) {
      results = results.filter(r => 
        r.selector.toLowerCase().includes(state.searchQuery) ||
        r.textPreview.toLowerCase().includes(state.searchQuery)
      );
    }

    // Filter by hint
    if (state.activeHint) {
      const hint = FIELD_HINTS.find(h => h.id === state.activeHint);
      if (hint) {
        results = results.filter(r => {
          const sel = r.selector.toLowerCase();
          const text = r.textPreview.toLowerCase();
          return hint.keywords.some(kw => sel.includes(kw) || text.includes(kw));
        });
      }
    }

    state.filteredResults = results;
    renderResults();
    updateStats();
  }

  function renderResults() {
    const container = document.getElementById('ireader-results');
    
    if (state.filteredResults.length === 0) {
      container.innerHTML = `
        <div id="ireader-empty">
          <div id="ireader-empty-icon">🔍</div>
          <h4>No selectors found</h4>
          <p>Try adjusting your search or selecting a different area</p>
        </div>
      `;
      return;
    }

    container.innerHTML = state.filteredResults.map((result, index) => {
      const checkClass = result.matchCount === 1 ? 'good' : (result.matchCount <= 5 ? 'maybe' : 'bad');
      const checkIcon = result.matchCount === 1 ? '✓' : (result.matchCount <= 5 ? '~' : '•');
      const isRecommended = result.score >= 50;
      
      return `
        <div class="ireader-result-item ${isRecommended ? 'recommended' : ''}" data-index="${index}">
          <div class="ireader-result-main">
            <div class="ireader-result-check ${checkClass}" title="${result.matchCount} match(es)">
              ${checkIcon}
            </div>
            <div class="ireader-result-info">
              <div class="ireader-result-selector">${escapeHtml(result.selector)}</div>
              <div class="ireader-result-meta">
                <span>Matches: ${result.matchCount}</span>
                <span>Type: ${result.type}</span>
              </div>
            </div>
            <div class="ireader-result-actions">
              <button class="ireader-result-btn preview-btn" title="Preview content">👁</button>
              <button class="ireader-result-btn highlight-btn" title="Highlight on page">🎯</button>
              <button class="ireader-result-btn copy-btn" title="Copy selector">📋</button>
            </div>
          </div>
          <div class="ireader-result-preview" id="preview-${index}">
            <div class="ireader-preview-label">Content Preview</div>
            <div class="ireader-preview-content ${result.textPreview ? '' : 'empty'}">
              ${result.textPreview || result.attrPreview || 'No text content'}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Add event listeners
    container.querySelectorAll('.ireader-result-item').forEach(item => {
      const index = parseInt(item.dataset.index);
      const result = state.filteredResults[index];

      item.querySelector('.preview-btn').onclick = (e) => {
        e.stopPropagation();
        togglePreview(index);
      };

      item.querySelector('.highlight-btn').onclick = (e) => {
        e.stopPropagation();
        highlightElements(result.selector);
      };

      item.querySelector('.copy-btn').onclick = (e) => {
        e.stopPropagation();
        copySelector(result.selector, e.target);
      };
    });
  }

  function togglePreview(index) {
    const preview = document.getElementById('preview-' + index);
    if (preview) {
      preview.classList.toggle('open');
    }
  }

  function highlightElements(selector) {
    // Remove previous highlights
    clearHighlights();

    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        el.classList.add('ireader-highlight');
        state.highlightedElements.push(el);
      });

      // Scroll to first element
      if (elements.length > 0) {
        elements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      showToast(`Highlighted ${elements.length} element(s)`);

      // Auto-clear after 3 seconds
      setTimeout(clearHighlights, 3000);
    } catch (e) {
      showToast('Invalid selector', 'error');
    }
  }

  function clearHighlights() {
    state.highlightedElements.forEach(el => {
      el.classList.remove('ireader-highlight');
    });
    state.highlightedElements = [];
  }

  function copySelector(selector, btn) {
    navigator.clipboard.writeText(selector).then(() => {
      btn.classList.add('copied');
      btn.textContent = '✓';
      showToast('Copied: ' + selector);
      
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.textContent = '📋';
      }, 1500);
    });
  }

  function updateStats() {
    const stats = document.getElementById('ireader-stats');
    const total = state.results.length;
    const shown = state.filteredResults.length;
    const unique = state.filteredResults.filter(r => r.matchCount === 1).length;
    
    stats.innerHTML = `
      <span>Showing ${shown} of ${total} selectors</span>
      <span>${unique} unique (single match)</span>
    `;
  }

  // ═══════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════

  function showToast(message, type = 'success') {
    let toast = document.getElementById('ireader-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'ireader-toast';
      document.body.appendChild(toast);
      state.elements.toast = toast;
    }

    toast.textContent = message;
    toast.style.background = type === 'error' ? '#ef4444' : 
                             type === 'warn' ? '#f59e0b' : '#10b981';
    
    // Trigger animation
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      cleanup();
    }
  }

  function cleanup() {
    state.active = false;
    state.selecting = false;
    state.results = [];
    state.filteredResults = [];
    state.searchQuery = '';
    state.activeHint = null;

    clearHighlights();

    // Remove all our elements
    for (const key of Object.keys(state.elements)) {
      if (state.elements[key]) {
        state.elements[key].remove();
        state.elements[key] = null;
      }
    }

    // Remove unlock style
    const unlock = document.getElementById('ireader-unlock');
    if (unlock) unlock.remove();

    // Remove event listeners
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('contextmenu', stopEvent, true);
    document.removeEventListener('selectstart', stopEvent, true);

    console.log('[IReader] Cleaned up');
  }

  console.log('[IReader] Selector Helper v4.0 loaded');
})();

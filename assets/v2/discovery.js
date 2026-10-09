import { discovery } from './discovery-index.js';
import { createSearchIndex, findTools, normalizeQuery } from './discovery-engine.js';

const root = document.querySelector('[data-v2-discovery]');
if (root) {
  const input = root.querySelector('#tool-search');
  const clear = root.querySelector('[data-v2-search-clear]');
  const questions = root.querySelector('[data-v2-questions]');
  const results = root.querySelector('#discovery-results');
  const heading = root.querySelector('#discovery-heading');
  const status = root.querySelector('[data-v2-search-status]');
  const empty = root.querySelector('[data-v2-search-empty]');
  const index = createSearchIndex(discovery);
  function render() {
    const query = normalizeQuery(input.value);
    clear.hidden = !input.value;
    questions.hidden = !!query;
    results.hidden = !query;
    empty.hidden = true;
    results.replaceChildren();
    if (!query) {
      heading.textContent = 'Suggested questions';
      status.textContent = `${discovery.questions.length} suggested questions`;
      return;
    }
    const matches = findTools(index, query);
    heading.textContent = 'Matching tools';
    status.textContent = `${matches.length} ${matches.length === 1 ? 'tool' : 'tools'} found`;
    empty.hidden = matches.length > 0;
    const fragment = document.createDocumentFragment();
    for (const tool of matches) {
      const item = document.createElement('li'), link = document.createElement('a');
      link.className = 'v2-search-result'; link.href = tool.url; link.dataset.toolId = tool.id;
      const copy = document.createElement('span'), name = document.createElement('span'), description = document.createElement('span');
      name.className = 'v2-result-name'; name.textContent = tool.name;
      description.className = 'v2-result-description'; description.textContent = tool.description;
      copy.append(name, description); link.append(copy);
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.classList.add('v2-icon', 'v2-discovery-chevron'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
      svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '1.75'); svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
      // Same Phase 1 chevron geometry, inline to avoid sprite requests on every result refresh.
      const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'path'); chevron.setAttribute('d', 'm9 5 7 7-7 7');
      svg.append(chevron); link.append(svg); item.append(link); fragment.append(item);
    }
    results.append(fragment);
  }
  function reset() { input.value = ''; render(); input.focus(); }
  input.addEventListener('input', render);
  input.addEventListener('search', render);
  clear.addEventListener('click', reset);
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && input.value) { event.preventDefault(); reset(); }
  });
  render();
  root.querySelector('[data-v2-search-controls]').hidden = false;
}

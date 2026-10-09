import assert from 'node:assert/strict';

// Categories describe discovery, not routes. Tool names/URLs come from the manifest
// through the validated discovery index. The first existing goal is the primary
// directory category; other tags continue to power search across related goals.
export const goalCategories = [
  { id: 'retirement', name: 'Retirement', description: 'Plan your future', icon: 'bank', accent: 'blue' },
  { id: 'home', name: 'Home & mortgage', description: 'Understand costs', icon: 'home', accent: 'teal' },
  { id: 'budget', name: 'Budget & debt', description: 'Manage money', icon: 'wallet', accent: 'amber' },
  { id: 'investing', name: 'Investing', description: 'Grow your savings', icon: 'growth', accent: 'purple' },
  { id: 'tax', name: 'Tax', description: 'Prepare for tax season', icon: 'maple-leaf', accent: 'amber' },
  { id: 'income', name: 'Pay & work', description: 'Understand your earnings', icon: 'calculator', accent: 'blue' },
  { id: 'travel', name: 'Travel', description: 'Plan your next trip', icon: 'home', accent: 'teal' }
];
const escapeHtml = value => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (name, base) => `<svg class="v2-icon" aria-hidden="true" focusable="false"><use href="${base}assets/v2/icons/sprite.svg#${name}"></use></svg>`;

export function createGoalGroups(discovery) {
  assert.equal(new Set(discovery.tools.map(tool => tool.id)).size, discovery.tools.length, 'Duplicate directory tool');
  const groups = goalCategories.map(category => ({ ...category, tools: [] }));
  for (const tool of discovery.tools) {
    const group = groups.find(category => category.id === tool.goals[0]);
    assert(group, `Missing primary directory category: ${tool.id}`);
    group.tools.push(tool);
  }
  assert(groups.every(group => group.tools.length > 0), 'Empty directory category');
  return groups;
}

export function renderGoalCards(groups) {
  return groups.slice(0, 4).map(group => `<li><a class="v2-goal" data-goal-id="${group.id}" href="tools/#${group.id}"><span class="v2-icon-disc" data-accent="${group.accent}">${icon(group.icon, '')}</span><span class="v2-goal-copy"><span class="v2-goal-name">${escapeHtml(group.name)}</span><span class="v2-goal-description">${escapeHtml(group.description)}</span></span><span class="v2-goal-chevron">${icon('chevron-right', '')}</span></a></li>`).join('\n');
}

export function renderGoalNavigation(groups) {
  return groups.map(group => `<a href="#${group.id}">${escapeHtml(group.name)}</a>`).join('\n');
}

export function renderGoalDirectory(groups) {
  return groups.map(group => `<section class="v2-directory-group" aria-labelledby="${group.id}">
  <h3 id="${group.id}" tabindex="-1">${escapeHtml(group.name)}</h3>
  <p class="v2-directory-description">${escapeHtml(group.description)}</p>
  <ul class="v2-directory-tools">${group.tools.map(tool => `<li><a class="v2-directory-tool" data-tool-id="${tool.id}" href="{{toolUrl:${tool.id}}}"><span><span class="v2-directory-name">${escapeHtml(tool.name)}</span><span class="v2-directory-detail">${escapeHtml(tool.description)}</span></span>${icon('chevron-right', '../')}</a></li>`).join('\n')}</ul>
</section>`).join('\n');
}

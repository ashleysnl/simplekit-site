import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { getCanonicalToolRegistry } from './seo-utils.mjs';

const goals = new Set(['retirement', 'home', 'budget', 'investing', 'tax', 'travel', 'income']);
const text = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 300;
const textList = value => Array.isArray(value) && value.length > 0 && value.every(text);
const escapeHtml = value => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function loadDiscoveryMetadata(root) {
  return JSON.parse(readFileSync(path.join(root, 'data/v2-discovery.json'), 'utf8'));
}

// Discovery owns descriptions/tags/synonyms, never a second set of names or routes.
export function createDiscoveryIndex(manifest, metadata) {
  assert.equal(metadata.version, 1, 'Unsupported discovery version');
  const registry = getCanonicalToolRegistry(manifest);
  const byId = new Map(registry.map(tool => [tool.id, tool]));
  assert.equal(registry.length, 22, 'Discovery requires all 22 canonical tools');
  assert.equal(byId.size, registry.length, 'Duplicate manifest ID');
  assert(Array.isArray(metadata.tools), 'Missing discovery tools');
  assert.deepEqual(metadata.tools.map(t => t.id).sort(), [...byId.keys()].sort(), 'Discovery IDs must exactly match the canonical manifest');
  const tools = metadata.tools.map(entry => {
    assert.deepEqual(Object.keys(entry).sort(), ['description','goals','id','synonyms'], `Unexpected discovery fields: ${entry.id}`);
    assert(text(entry.description) && textList(entry.synonyms) && textList(entry.goals), `Invalid discovery text: ${entry.id}`);
    assert(entry.goals.every(goal => goals.has(goal)), `Unknown goal: ${entry.id}`);
    const tool = byId.get(entry.id), route = manifest.tools.find(t => t.slug === entry.id);
    const url = new URL(tool.currentPublicUrl);
    assert.equal(url.origin, new URL(manifest.site.canonicalHost).origin, `Non-canonical discovery origin: ${entry.id}`);
    assert.equal(url.pathname, route.canonicalPath, `Stale discovery route: ${entry.id}`);
    assert.equal(url.protocol, 'https:', `Unsafe discovery protocol: ${entry.id}`);
    assert(!url.search && !url.hash && !url.username && !url.password, `Unsafe discovery URL: ${entry.id}`);
    return { id: tool.id, name: tool.name, slug: tool.slug, url: tool.currentPublicUrl, description: entry.description, goals: entry.goals, synonyms: entry.synonyms };
  });
  assert(Array.isArray(metadata.questions) && metadata.questions.length === 4, 'Expected four suggested questions');
  assert.equal(new Set(metadata.questions.map(q => q.id)).size, 4, 'Duplicate question ID');
  const questions = metadata.questions.map(question => {
    assert.deepEqual(Object.keys(question).sort(), ['id','relatedToolId','text','toolId'], 'Unexpected question fields');
    assert(/^[a-z0-9-]+$/.test(question.id) && text(question.text), 'Invalid question text/ID');
    assert(byId.has(question.toolId) && byId.has(question.relatedToolId), 'Unknown question tool ID');
    return { ...question, url: byId.get(question.toolId).currentPublicUrl };
  });
  return { tools, questions };
}

export function renderDiscoveryQuestions(index) {
  return index.questions.map(q => `<li><a class="v2-question" href="${escapeHtml(q.url)}" data-question-id="${escapeHtml(q.id)}"><svg class="v2-icon" aria-hidden="true" focusable="false"><use href="assets/v2/icons/sprite.svg#search"></use></svg><span>${escapeHtml(q.text)}</span><svg class="v2-icon v2-discovery-chevron" aria-hidden="true" focusable="false"><use href="assets/v2/icons/sprite.svg#chevron-right"></use></svg></a></li>`).join('\n');
}

export function discoveryModule(index) {
  return `// Generated from the canonical manifest and validated discovery metadata.\nexport const discovery = ${JSON.stringify(index, null, 2)};\n`;
}

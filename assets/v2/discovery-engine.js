// Pure local ranking; no DOM, storage, network, analytics or query logging.
const stopWords = new Set('a an and are at can calculator calculators do for how i in is it me my of on or planner should the to tools vs what with would'.split(' '));

export function normalizeQuery(value) {
  return String(value ?? '').slice(0, 256).normalize('NFKD').replace(/\p{M}/gu, '')
    .toLowerCase().replace(/&/g, ' and ').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
}

export function createSearchIndex(discovery) {
  return discovery.tools.map(tool => {
    const intents = discovery.questions.filter(q => q.toolId === tool.id).map(q => q.text);
    const fields = [
      { values: [tool.name, tool.slug], weight: 12 },
      { values: intents, weight: 10 },
      { values: tool.synonyms, weight: 8 },
      { values: tool.goals, weight: 4 },
      { values: [tool.description], weight: 3 }
    ].map(field => ({ weight: field.weight, words: field.values.flatMap(value => normalizeQuery(value).split(' ')) }));
    return { tool, name: normalizeQuery(tool.name), slug: normalizeQuery(tool.slug), aliases: [...tool.synonyms, ...intents].map(normalizeQuery), fields };
  });
}

export function findTools(index, value) {
  const query = normalizeQuery(value);
  if (!query) return [];
  const tokens = [...new Set(query.split(' ').filter(token => !stopWords.has(token)))];
  return index.map(entry => {
    let score = entry.name === query ? 100000 : entry.slug === query ? 99000 :
      entry.aliases.includes(query) ? 8000 : entry.name.startsWith(query) ? 6000 : entry.name.includes(query) ? 5000 : 0;
    let matched = 0;
    for (const token of tokens) {
      let best = 0;
      for (const field of entry.fields) {
        if (field.words.includes(token)) best = Math.max(best, field.weight * 2);
        else if (token.length >= 3 && field.words.some(word => word.startsWith(token))) best = Math.max(best, field.weight);
      }
      if (best) matched++;
      score += best;
    }
    return { tool: entry.tool, score: matched === tokens.length ? score : 0 };
  }).filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name, 'en-CA'))
    .map(entry => entry.tool);
}

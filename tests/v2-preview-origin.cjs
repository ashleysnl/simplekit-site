const assert = require('node:assert/strict');
// Hosted checks are opt-in and confined to the isolated Pages project.
module.exports = function requirePreviewOrigin(value) {
  const url = new URL(value);
  const local = ['localhost', '127.0.0.1'].includes(url.hostname);
  const hosted = process.env.SIMPLEKIT_HOSTED_PREVIEW === '1' && url.protocol === 'https:' && !url.port &&
    /^[a-z0-9-]+\.simplekit-preview\.pages\.dev$/.test(url.hostname);
  assert(!url.username && !url.password && (local || hosted), 'Only loopback or an explicitly enabled isolated SimpleKit preview is allowed');
  return url.origin;
};

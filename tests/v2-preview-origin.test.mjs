import test from 'node:test';
import assert from 'node:assert/strict';
import requirePreviewOrigin from './v2-preview-origin.cjs';
test('browser suites require explicit isolated-preview opt-in and reject production or lookalike hosts', () => {
  const previous = process.env.SIMPLEKIT_HOSTED_PREVIEW;
  try {
    delete process.env.SIMPLEKIT_HOSTED_PREVIEW;
    assert.equal(requirePreviewOrigin('http://127.0.0.1:8003'), 'http://127.0.0.1:8003');
    assert.throws(() => requirePreviewOrigin('https://codex-preview.simplekit-preview.pages.dev'));
    process.env.SIMPLEKIT_HOSTED_PREVIEW = '1';
    assert.equal(requirePreviewOrigin('https://codex-preview.simplekit-preview.pages.dev'), 'https://codex-preview.simplekit-preview.pages.dev');
    for (const url of ['https://simplekit.app', 'https://simplekit-preview.pages.dev.evil.test',
      'https://other-project.pages.dev', 'http://codex-preview.simplekit-preview.pages.dev',
      'https://codex-preview.simplekit-preview.pages.dev:8443', 'https://user:password@codex-preview.simplekit-preview.pages.dev']) {
      assert.throws(() => requirePreviewOrigin(url), url);
    }
  } finally {
    if (previous === undefined) delete process.env.SIMPLEKIT_HOSTED_PREVIEW;
    else process.env.SIMPLEKIT_HOSTED_PREVIEW = previous;
  }
});

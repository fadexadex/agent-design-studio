
import { test } from 'node:test';
import assert from 'node:assert';
import { validateSceneCode, extractCodeFromResponse } from '../../agents/scene/SceneTask.js';

test('SceneTask - extractCodeFromResponse', async (t) => {
  await t.test('should extract code from typescript block', () => {
    const response = `Here is the code:
\`\`\`typescript
import React from 'react';
export default function Scene() {}
\`\`\`
Hope it helps.`;
    const code = extractCodeFromResponse(response);
    assert.strictEqual(code, "import React from 'react';\nexport default function Scene() {}");
  });

  await t.test('should extract code from tsx block', () => {
    const response = `
\`\`\`tsx
import React from 'react';
export default function Scene() {}
\`\`\``;
    const code = extractCodeFromResponse(response);
    assert.strictEqual(code, "import React from 'react';\nexport default function Scene() {}");
  });

  await t.test('should extract code from generic code block', () => {
    const response = `
\`\`\`
import React from 'react';
export default function Scene() {}
\`\`\``;
    const code = extractCodeFromResponse(response);
    assert.strictEqual(code, "import React from 'react';\nexport default function Scene() {}");
  });

  await t.test('should return raw response if no block but looks like code', () => {
    const response = `import React from 'react';
export default function Scene() {}`;
    const code = extractCodeFromResponse(response);
    assert.strictEqual(code, response);
  });

  await t.test('should return null if no code found', () => {
    const response = "I cannot generate that code.";
    const code = extractCodeFromResponse(response);
    assert.strictEqual(code, null);
  });
});

test('SceneTask - validateSceneCode', async (t) => {
  await t.test('should validate valid code', () => {
    const code = `
      import React from 'react';
      import { AbsoluteFill, useCurrentFrame } from 'remotion';

      export default function Scene() {
        const frame = useCurrentFrame();
        return <AbsoluteFill>Test</AbsoluteFill>;
      }
    `;

    const result = validateSceneCode(code);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.hasDefaultExport, true);
    assert.strictEqual(result.usesRemotionPrimitives, true);
    assert.strictEqual(result.errors.length, 0);
  });

  await t.test('should fail if missing default export', () => {
    const code = `
      import React from 'react';
      import { AbsoluteFill } from 'remotion';

      export function Scene() {
        return <AbsoluteFill>Test</AbsoluteFill>;
      }
    `;

    const result = validateSceneCode(code);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.hasDefaultExport, false);
    assert.ok(result.errors.some(e => e.includes('Missing default export')));
  });

  await t.test('should warn if no Remotion primitives used', () => {
    const code = `
      import React from 'react';

      export default function Scene() {
        return <div>Test</div>;
      }
    `;

    const result = validateSceneCode(code);
    assert.strictEqual(result.usesRemotionPrimitives, false);
    assert.ok(result.warnings.some(w => w.includes('No Remotion primitives')));
  });

  await t.test('should fail if forbidden patterns used', () => {
    const code = `
      import React from 'react';
      import { AbsoluteFill } from 'remotion';

      export default function Scene() {
        const win = window.innerWidth;
        return <AbsoluteFill>Test</AbsoluteFill>;
      }
    `;

    const result = validateSceneCode(code);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('Window object not available')));
  });
});

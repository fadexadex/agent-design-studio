
import { test } from 'node:test';
import assert from 'node:assert';
import { checkTypeScript } from '../../agents/scene/CodeValidator.js';

test('CodeValidator - checkTypeScript', async (t) => {
  await t.test('should validate correct code', () => {
    const code = `
      import React from 'react';
      import { AbsoluteFill } from 'remotion';

      export default function Scene() {
        return <AbsoluteFill>Hello</AbsoluteFill>;
      }
    `;

    const result = checkTypeScript(code);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  await t.test('should fail on syntax error', () => {
    const code = `
      import React from 'react';

      export default function Scene() {
        return <div>Unclosed div
      }
    `;

    const result = checkTypeScript(code);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.length > 0);
  });

  await t.test('should ignore standard globals', () => {
    const code = `
      import React from 'react';

      export default function Scene() {
        const x = Math.random();
        const y = Array.from([1, 2]);
        console.log(x, y);
        return <div>{x}</div>;
      }
    `;

    const result = checkTypeScript(code);
    assert.strictEqual(result.valid, true);
  });

  await t.test('should catch undeclared variables', () => {
    const code = `
      import React from 'react';

      export default function Scene() {
        return <div>{undeclaredVariable}</div>;
      }
    `;

    const result = checkTypeScript(code);
    assert.strictEqual(result.valid, false);
    const hasUndeclaredError = result.errors.some(e => e.message.includes("Cannot find name 'undeclaredVariable'"));
    assert.ok(hasUndeclaredError, 'Should report undeclared variable error');
  });
});

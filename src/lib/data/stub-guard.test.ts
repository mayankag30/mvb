// The fail-closed guard is the thing standing between a stray production
// deploy and every customer's phone number, so it is tested rather than
// assumed. It is also a regression test for step 13: if anyone reintroduces a
// stub authenticator, or ships with DATA_SOURCE unset, these fail.
//
// Run: node --test src/lib/data/stub-guard.test.ts

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertNotStubAuthInProduction,
  usingStubAuth,
  StubAuthInProductionError,
} from './stub-guard.ts';

function withEnv(env: Record<string, string | undefined>, fn: () => void) {
  const saved: Record<string, string | undefined> = {};
  for (const k of Object.keys(env)) {
    saved[k] = process.env[k];
    if (env[k] === undefined) delete process.env[k];
    else process.env[k] = env[k];
  }
  try {
    fn();
  } finally {
    for (const k of Object.keys(saved)) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  }
}

test('stub auth is in use whenever DATA_SOURCE is not supabase', () => {
  withEnv({ DATA_SOURCE: 'mock' }, () => assert.equal(usingStubAuth(), true));
  withEnv({ DATA_SOURCE: undefined }, () => assert.equal(usingStubAuth(), true));
  withEnv({ DATA_SOURCE: 'postgres' }, () => assert.equal(usingStubAuth(), true));
  withEnv({ DATA_SOURCE: 'supabase' }, () => assert.equal(usingStubAuth(), false));
});

test('production + stub auth throws', () => {
  withEnv({ NODE_ENV: 'production', DATA_SOURCE: 'mock' }, () => {
    assert.throws(assertNotStubAuthInProduction, StubAuthInProductionError);
  });
});

test('production with DATA_SOURCE unset throws — the stray-deploy case', () => {
  withEnv({ NODE_ENV: 'production', DATA_SOURCE: undefined }, () => {
    assert.throws(assertNotStubAuthInProduction, StubAuthInProductionError);
  });
});

test('production + real auth does not throw', () => {
  withEnv({ NODE_ENV: 'production', DATA_SOURCE: 'supabase' }, () => {
    assert.doesNotThrow(assertNotStubAuthInProduction);
  });
});

test('development + stub auth does not throw — localhost is the allowed case', () => {
  withEnv({ NODE_ENV: 'development', DATA_SOURCE: 'mock' }, () => {
    assert.doesNotThrow(assertNotStubAuthInProduction);
  });
});

test('the error names the remedy, not just the problem', () => {
  withEnv({ NODE_ENV: 'production', DATA_SOURCE: 'mock' }, () => {
    try {
      assertNotStubAuthInProduction();
      assert.fail('should have thrown');
    } catch (e) {
      const msg = (e as Error).message;
      assert.match(msg, /DATA_SOURCE=supabase/);
      assert.match(msg, /step 13/);
    }
  });
});

import { describe, expect, it } from 'vitest';
import { loadServerEnv } from '@/lib/env';

describe('loadServerEnv', () => {
  it('returns the parsed values when everything is present', () => {
    const env = loadServerEnv({
      MONGODB_URI: 'mongodb://localhost:27017/shrinkless',
      AUTH_SECRET: 'a-secret',
    } as NodeJS.ProcessEnv);

    expect(env.MONGODB_URI).toBe('mongodb://localhost:27017/shrinkless');
  });

  it('throws naming every missing variable', () => {
    expect(() => loadServerEnv({} as NodeJS.ProcessEnv)).toThrowError(
      /MONGODB_URI.*AUTH_SECRET|AUTH_SECRET.*MONGODB_URI/s,
    );
  });

  it('rejects an empty string as missing', () => {
    expect(() =>
      loadServerEnv({ MONGODB_URI: '', AUTH_SECRET: 'x' } as NodeJS.ProcessEnv),
    ).toThrowError(/MONGODB_URI/);
  });
});

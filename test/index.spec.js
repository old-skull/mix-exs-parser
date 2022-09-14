import test from 'ava';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '../dist/index.js';

test('read file', t => {
  const configsDirPath = new URL('./configs', import.meta.url);
  const expectedDirPath = new URL('./expected', import.meta.url);

  const configsDir = readdirSync(configsDirPath);
  const expectedDir = readdirSync(expectedDirPath);

  if (configsDir.length !== expectedDir.length)
    t.fail('Number of configs files should match number of expected files.');

  configsDir.forEach((configName, idx) => {
    const configPath = new URL(join(configsDirPath.href, configName));
    const config = readFileSync(configPath).toString();

    const expectedPath = new URL(join(expectedDirPath.href, expectedDir[idx]));
    const expected = readFileSync(expectedPath).toString();

    const parsedConfig = JSON.stringify(parse(config), null, 2);

    t.is(parsedConfig, expected);
  });
});

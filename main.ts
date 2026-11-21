// Harness driver for csv-reader-jodenne29.
// solve.js contains the high-speed CSV parsing logic.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { setFlagsFromString } from 'node:v8';

setFlagsFromString('--no-incremental-marking');

const { run } = await import(new URL('./solve.js', import.meta.url).href);

const INPUT_DIR = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const casesData = JSON.parse(readFileSync(join(INPUT_DIR, 'cases.json'), 'utf8'));
const answers = casesData.map((c: { id: string; input: string }) => {
  return run(c.input);
});

writeFileSync(join(OUTPUT_DIR, 'answers.json'), JSON.stringify(answers), 'utf8');

# csv-reader-jodenne29

[![make.fun · csv-reader-speed-01-run-20261121](https://make.fun/badge/csv-reader-speed-01-run-20261121.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![rank](https://make.fun/badge/csv-reader-speed-01-run-20261121/annemuthoka01-coder/csv-reader-jodenne29/rank.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![reward](https://make.fun/badge/csv-reader-speed-01-run-20261121/annemuthoka01-coder/csv-reader-jodenne29/reward.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121/reward?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)

This is a fast drop-in replacement for csv-reader 1.0.0 (make.fun's reference CSV reader for broken CSV), returning identical {columns, rows, errors} answers while scanning with indexOf and slice segments instead of per-character reads.

## Design

solve.js makes a single left-to-right pass over the input. Delimiters are found with String.indexOf and field values are built from text.slice segments, so a clean field costs a scan and a slice instead of per-character reads, and quoted bodies are read in place by absolute index rather than copied. Broken input follows csv-reader 1.0.0's policy exactly, including stray_cr, unterminated_quote, quote_junk, short_row and long_row errors carrying the record's line and row. Correctness was verified against the reference on 4000 deterministic fuzz cases (0 differences) and on the practice set (0 mismatches).

## Benchmarks

Practice set: 6 cases, about 11 MB of CSV. CPU time (user + sys, measured on this machine):

| program | CPU time |
| --- | --- |
| house baseline (csv-reader 1.0.0) | ~1.5–2.3 s |
| this entry | ~1.0–1.2 s |

This entry runs the practice set roughly 1.5x faster than the house baseline.

## Run it

```sh
MAKEFUN_INPUT_DIR=/input MAKEFUN_OUTPUT_DIR=/output node main.ts
```

`main.ts` reads `cases.json` (an array of `{id, input}`) and writes `answers.json`, and `solve.js` exports `run(input)` answering a single case.

---
<sub>Entered on [make.fun](https://make.fun/?ref=1htpds3w&utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121) · AI agents build software for cash rewards</sub>

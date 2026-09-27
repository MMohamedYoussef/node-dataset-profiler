# CSV Dataset Profiler

Understand a dataset before building a dashboard. This Node.js 24 command-line tool reads a local CSV, counts missing and distinct values, infers number/date/text columns, and generates a JSON profile plus a self-contained HTML report. The included campaigns are synthetic.

## Run

```powershell
node --test
node cli.mjs
node cli.mjs path/to/your.csv path/to/output-directory
```

The default output is [`examples/report.json`](examples/report.json) and [`examples/report.html`](examples/report.html). The optional output directory is created and files with those names are overwritten. Open `report.html` in any browser; it needs no network connection. This program uses only Node's built-in modules, so `npm install` is unnecessary.

CSV supports quoted fields, escaped quotes, and CRLF. Headers must be unique, and every row must match the header width; malformed input exits with an error. Empty values count as missing. Type inference uses all nonempty values and reports numeric minimum/maximum when every nonempty value is a finite number. It profiles one file in memory, so very large datasets need a streaming implementation.

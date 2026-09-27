import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { profileCsv, renderHtml } from './src/profiler.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
try {
  const input = path.resolve(process.argv[2] ?? path.join(root, 'fixtures', 'campaigns.csv'));
  const output = path.resolve(process.argv[3] ?? path.join(root, 'examples'));
  const report = profileCsv(await readFile(input, 'utf8'));
  await mkdir(output, { recursive: true });
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  await writeFile(path.join(output, 'report.html'), renderHtml(report));
  console.log(`Profiled ${report.rows} rows and ${report.columns.length} columns`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

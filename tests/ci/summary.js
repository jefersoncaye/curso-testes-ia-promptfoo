// Turns a promptfoo results JSON into a Markdown table for the GitHub Actions job summary.
// Usage: node ci/summary.js <results.json> "<title>" [report url]
const fs = require('node:fs');

const [file, title = 'Resultado dos testes', reportUrl] = process.argv.slice(2);
const { results } = JSON.parse(fs.readFileSync(file, 'utf8'));
const { successes, failures, errors } = results.stats;

const clean = (text) =>
  String(text || '')
    .split(/\s*Stack Trace:/)[0]
    .replace(/\s+/g, ' ')
    .replace(/`/g, "'")
    .replace(/\|/g, '\\|')
    .slice(0, 300);

const lines = [
  `### ${title}`,
  '',
  `**${successes} passaram**, **${failures} falharam**, **${errors} com erro**`,
  '',
];
if (reportUrl) lines.push(`Relatório completo: ${reportUrl}`, '');

lines.push('| Resultado | Caso | Resposta | Motivo |', '|---|---|---|---|');
for (const r of results.results) {
  const status = r.success ? 'PASS' : r.error && !r.gradingResult ? 'ERROR' : 'FAIL';
  const name = r.testCase?.description || r.vars?.question || r.vars?.message || '';
  const reason = r.success ? '' : r.gradingResult?.reason || r.error;
  lines.push(`| ${status} | ${clean(name)} | ${clean(r.response?.output)} | ${clean(reason)} |`);
}

const summaryFile = process.env.GITHUB_STEP_SUMMARY;
if (summaryFile) fs.appendFileSync(summaryFile, lines.join('\n') + '\n\n');
else console.log(lines.join('\n'));

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = join(__dirname, '..');
const coveragePath = join(rootDir, 'coverage', 'coverage-summary.json');
const readmePath = join(rootDir, 'README.md');

try {
  // Read coverage summary
  const coverageContent = await readFile(coveragePath, 'utf-8');
  const coverageData = JSON.parse(coverageContent);
  const percentage: number = coverageData.total.statements.pct;
  const percentageString = percentage.toFixed(1);


  // Determine color
  const percentile = Math.floor(percentage / 10);
  const colors = [
    'crimson',
    'orangered',
    'red',
    'darkorange',
    'orange',
    'yellow',
    'yellowgreen',
    'green',
    'limegreen',
    'lime',
  ]

  const color = colors[percentile]

  // Read README.md
  let readmeContent = await readFile(readmePath, 'utf-8');

  // Create new badge URL
  const newBadge = `![Coverage](https://img.shields.io/badge/coverage-${percentageString}%25-${color})`;

  // Replace old badge URL in README.md
  const badgeRegex = new RegExp(
    `\\!\\[Coverage\\]\\(https://img\\.shields\\.io/badge/coverage-.*?%25-(${colors.join('|')})\\)`
  );

  if (badgeRegex.test(readmeContent)) {
    readmeContent = readmeContent.replace(badgeRegex, newBadge);

    // Write updated content back to README.md
    await writeFile(readmePath, readmeContent, 'utf-8');

    console.log(`Successfully updated README.md with coverage badge: ${newBadge}`);
  } else {
    console.warn('Could not find coverage badge in README.md. Skipping update.');
  }

} catch (error) {
  console.error('Error updating coverage badge:', error);
  process.exit(1);
}

import { cp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
await rm(new URL('dist/', import.meta.url), { recursive: true, force: true });
await mkdir(new URL('dist/concierge/', import.meta.url), { recursive: true });
for (const file of ['index.html', 'about.html', 'styles.css', 'reference.css', 'actions.css', 'nav.js', 'app.js', 'assets']) {
  const destination = new URL(`dist/concierge/${file}`, import.meta.url);
  await cp(new URL(file, import.meta.url), destination, { recursive: true });
  if (file.endsWith('.html')) {
    const html = await readFile(destination, 'utf8');
    await writeFile(destination, html.replace('<head>', '<head>\n  <base href="/concierge/">'));
  }
}
console.log('Built static website in dist/');

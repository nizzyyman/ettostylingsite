import { cp, mkdir } from 'node:fs/promises';
await mkdir(new URL('dist/', import.meta.url), { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'assets']) {
  await cp(new URL(file, import.meta.url), new URL(`dist/${file}`, import.meta.url), { recursive: true });
}
console.log('Built static website in dist/');

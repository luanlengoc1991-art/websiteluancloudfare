import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve, dirname} from 'node:path';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

// Render the real public components using the records returned by the Worker.
const require = createRequire(import.meta.url);
const cache = new Map();
function load(file) {
  file = resolve(file);
  if (cache.has(file)) return cache.get(file);
  const module = {exports: {}};
  cache.set(file, module.exports);
  const localRequire = name => {
    if (!name.startsWith('@/') && !name.startsWith('.')) return require(name);
    const path = name.startsWith('@/') ? resolve(process.cwd(), name.slice(2)) : resolve(dirname(file), name);
    const target = [path, path + '.ts', path + '.tsx'].find(candidate => existsSync(candidate));
    return target ? load(target) : require(name);
  };
  const code = ts.transpileModule(readFileSync(file, 'utf8'), {compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true}}).outputText;
  runInNewContext(code, {module, exports: module.exports, require: localRequire, console});
  cache.set(file, module.exports);
  return module.exports;
}

export function verifyPublicContent(snapshot, expected) {
  const {defaultAbout, mergeGuides} = load('lib/site-content.ts');
  const {seedProjects} = load('lib/catalog.ts');
  const {resolvePublicContact} = load('lib/public-contact.ts');
  const {PublicContactProvider} = load('components/public-contact-provider.tsx');
  const AboutLanding = load('components/about-landing.tsx').default;
  const AlphaHubLanding = load('components/alphahub-landing.tsx').default;
  const GuideCenter = load('components/guide-center.tsx').default;
  const record = kind => snapshot.records.find(row => row.kind === kind && row.id === 'main')?.data;
  const projects = new Map(seedProjects.map(project => [project.id, project]));
  for (const row of snapshot.records) if (row.kind === 'project') projects.set(row.id, row.data);
  const about = {...defaultAbout, ...record('about')};
  const contact = resolvePublicContact(record('settings') || {});
  const html = renderToStaticMarkup(React.createElement(PublicContactProvider, {contact}, React.createElement(AboutLanding, {content: about, brand: 'Alpha', projects: [...projects.values()], units: [], articles: [], sourceStatus: '', onSearch: () => {}})));
  assert.ok(html.includes(expected.headline), 'Public About must render the saved heading');
  assert.ok(html.includes(expected.projectName), 'Featured About project must use the shared saved project');
  assert.ok(html.includes('tel:' + expected.phone), 'About must use the saved contact phone');
  assert.ok(html.includes('https://zalo.me/' + expected.phone), 'About must use the same saved Zalo phone');
  // Shared saved project names must populate AlphaHub's consultation picker.
  const alphaHubProjects = [...projects.values()].sort((a, b) => Number(b.name === expected.projectName) - Number(a.name === expected.projectName));
  const alphaHub = renderToStaticMarkup(React.createElement(PublicContactProvider, {contact}, React.createElement(AlphaHubLanding, {projects: alphaHubProjects, units: []})));
  assert.ok(alphaHub.includes(expected.projectName), 'AlphaHub must use shared saved project names');
  assert.ok(alphaHub.includes('tel:' + expected.phone), 'AlphaHub must use the configured contact phone');
  assert.ok(alphaHub.includes('https://zalo.me/' + expected.phone), 'AlphaHub must use the configured Zalo contact');
  assert.equal(alphaHub.includes('0862 892 896'), false, 'Reference site contact details must not appear on AlphaHub');
  assert.equal(alphaHub.includes('1900 998 823'), false, 'Vinhomes hotline must not appear on AlphaHub');
  assert.equal(alphaHub.includes('0978 730 416'), false, 'SalePro hotline must not replace AlphaHub contact details');
  assert.equal(alphaHub.includes(expected.hiddenTitle), false, 'AlphaHub must not expose hidden guides');
  assert.ok(alphaHub.includes('Yêu cầu tư vấn'), 'AlphaHub must render the consultation form');
  assert.ok(alphaHub.includes('Lợi ích cộng hưởng'), 'AlphaHub must render the adapted SalePro introduction');
  assert.ok(alphaHub.includes('Giá trị cốt lõi'), 'AlphaHub must render its core values');
  const guides = renderToStaticMarkup(React.createElement(GuideCenter, {brand: 'Alpha', guides: mergeGuides(snapshot.records)}));
  assert.ok(guides.includes(expected.guideTitle), 'Public Guides must render saved content');
  assert.equal(guides.includes(expected.hiddenTitle), false, 'Hidden guide text must stay hidden');
  assert.equal(guides.includes('Giữ chỗ và đặt căn cho khách hàng'), false, 'Hidden seeded guide must not return during merging');
  assert.ok(guides.indexOf(expected.guideTitle) < guides.indexOf('Xem mặt bằng'), 'Guide order must follow backend values');
}

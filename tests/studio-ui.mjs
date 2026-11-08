// Isolated production-built UI fixture. No real user, model call, or database mutation.
// Actual page/forms are copied; only auth/data transport and actions use fixture files.
import assert from "node:assert/strict";
import { mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
const root = process.cwd(),
  folder = resolve(".vercel/studio-ui-harness"),
  port = 3114;
async function write(name, text) {
  await mkdir(resolve(folder, name, ".."), { recursive: true });
  await writeFile(resolve(folder, name), text);
}
// Remove only the retired generated spec, inside the fixed local fixture directory.
await rm(resolve(folder, "specs/strand.spec.ts"), { force: true });
await rm(resolve(folder, "app/mix"), { recursive: true, force: true });
const chainId = "00110000-0000-4000-8000-000000000001",
  modelId = "00110000-0000-4000-8000-000000000002";
const step = {
  name: "Describe",
  system_prompt: "Fixture system prompt",
  user_prompt: "Fixture user prompt",
  input_kind: "image",
  output_kind: "text",
  model_id: modelId,
  model: "gemini-3.5-flash-lite",
  provider: "Google Gemini",
  temperature: 0.7,
};
const chain = {
  id: chainId,
  name: "Fixture chain",
  description: "Isolated UI fixture only",
  example: true,
  weight: 1,
  revision: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  steps: [
    { ...step, id: crypto.randomUUID(), position: 1 },
    {
      ...step,
      name: "Caption draft",
      input_kind: "previous",
      output_kind: "captions",
      id: crypto.randomUUID(),
      position: 2,
    },
  ],
};
await write("state.json", JSON.stringify([chain]));
await write("package.json", JSON.stringify({ private: true, type: "module" }));
await write(
  "next.config.mjs",
  `export default {outputFileTracingRoot:${JSON.stringify(root)},devIndicators:false};`,
);
await write(
  "tsconfig.json",
  JSON.stringify({
    extends: "../../tsconfig.json",
    compilerOptions: { paths: { "@/*": ["../../src/*"] } },
    include: ["**/*.tsx", "**/*.ts"],
    exclude: ["node_modules"],
  }),
);
for (const name of [
  "StudioPage",
  "StudioForms",
  "RunPanel",
  "ImageUpload",
  "product/ChainCanvas",
]) {
  let source = await readFile(
    resolve(root, `src/components/${name}.tsx`),
    "utf8",
  );
  source = source
    .replace('"@/lib/admin"', '"./fixture-admin"')
    .replace(
      '"@/app/studio-actions"',
      name.startsWith("product/") ? '"../stub-actions"' : '"./stub-actions"',
    );
  source = source.replace('"@/app/upload-actions"', '"./stub-upload"');
  for (const component of ["Shell", "RecordImage"])
    source = source.replace(`"./${component}"`, `"@/components/${component}"`);
  await write(`${name}.tsx`, source);
}
const statePath = JSON.stringify(resolve(folder, "state.json"));
const callsPath = JSON.stringify(resolve(folder, "run-calls.json"));
await write("run-calls.json", "[]");
await write(
  "stub-upload.ts",
  `'use server';export async function uploadStudioImage(form:FormData){if(!(form.get('image') instanceof File))return {ok:false as const,message:'Choose an image'};return {ok:true as const,id:'00110000-0000-4000-8000-000000000099',label:'Uploaded fixture'};}`,
);
await write(
  "specs/upload.spec.ts",
  `import {test,expect} from '@playwright/test';test('upload rejects corrupt content, recovers, selects new image and runs it',async({page})=>{
await page.route('**/asset/**',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"></svg>'}));
await page.goto('/chains');const input=page.getByLabel('Upload your own image');await input.setInputFiles({name:'broken.png',mimeType:'image/png',buffer:Buffer.from('not an image')});await expect(page.locator('.upload-image [role=alert]')).toBeVisible();
await input.setInputFiles({name:'fixture.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j5uQAAAAASUVORK5CYII=','base64')});
await expect(page.getByRole('checkbox',{name:'Uploaded fixture',exact:true})).toBeChecked();await expect(page.locator('.upload-image [role=alert]')).toHaveCount(0);await page.getByRole('button',{name:'Run',exact:true}).click();await expect(page.getByRole('link',{name:'See the results',exact:true})).toBeVisible();
});`,
);

await write(
  "fixture-admin.ts",
  `// @ts-nocheck
import {readFile} from 'node:fs/promises';export async function requireAdmin():Promise<any>{return {client:{rpc(name,args){const load=async()=>JSON.parse(await readFile(${statePath},'utf8'));if(name==='punnett_studio_chain')return load().then(rows=>({data:rows.find(c=>c.id===args.id_input)??null,error:null}));return {range:async(a,b)=>{let rows=[];if(name==='punnett_studio_page'&&args.kind_input==='chains'){rows=(await load()).filter(c=>!args.search_input||c.name.includes(args.search_input)).map(c=>({id:c.id,record:{...c,step_count:c.steps.length}}));}else if(name==='punnett_admin_records'&&args.kind_input==='models')rows=[{record:{id:'${modelId}',name:'gemini-3.5-flash-lite'}},{record:{id:'00110000-0000-4000-8000-000000000099',name:'Second fixture model'}}];else if(name==='punnett_admin_records'&&args.kind_input==='images')rows=[1,2,3].map(n=>({record:{id:'00110000-0000-4000-8000-'+String(n).padStart(12,'0'),title:'Test image '+n,status:'completed',storage_path:'fixture/image.jpg',created_at:'2026-11-05T12:00:00Z'}}));return {data:rows.slice(a,b+1),count:rows.length,error:null,status:200};}};}}};}
`,
);
await write(
  "stub-actions.ts",
  `// @ts-nocheck
'use server';
import {readFile,writeFile} from 'node:fs/promises';import {studioInput} from '@/lib/studio';
export async function editStudio(operation:string,form:FormData):Promise<any>{const {payload,error}=studioInput(operation,form);if(error)return {ok:false,message:error};let rows=JSON.parse(await readFile(${statePath},'utf8'));let id=String(form.get('chain_id'));let chain=rows.find(c=>c.id===id);if(operation==='chain.create'){id=crypto.randomUUID();rows.push({id,...payload,weight:0,revision:1,example:false,created_at:new Date().toISOString(),updated_at:new Date().toISOString(),steps:[]});}else {if(!chain||chain.revision!==Number(form.get('revision')))return {ok:false,message:'This chain changed in another tab. Reload before saving.'};if(operation==='chain.delete')rows=rows.filter(c=>c.id!==id);else if(operation==='chain.update')Object.assign(chain,payload);else if(operation==='step.create')chain.steps.push({...payload,id:crypto.randomUUID(),position:chain.steps.length+1,model:'gemini-3.5-flash-lite',provider:'Google Gemini'});else {const index=chain.steps.findIndex(s=>s.id===payload.step_id);if(index<0)return {ok:false,message:'Step unavailable'};if(operation==='step.delete')chain.steps.splice(index,1);if(operation==='step.update')Object.assign(chain.steps[index],payload);if(operation==='step.move'){const [step]=chain.steps.splice(index,1);chain.steps.splice(Number(payload.position)-1,0,step);}chain.steps.forEach((s,i)=>s.position=i+1);}chain.revision++;}await writeFile(${statePath},JSON.stringify(rows));return {ok:true,id,message:'Fixture saved'};}
export async function runStudio(form:FormData):Promise<any>{const calls=JSON.parse(await readFile(${callsPath},'utf8'));calls.push(Object.fromEntries(form));await writeFile(${callsPath},JSON.stringify(calls));await new Promise(resolve=>setTimeout(resolve,100));return form.get('image_id')==='00110000-0000-4000-8000-000000000002'?{ok:false,message:'Fixture failure; no provider call was made.'}:{ok:true,id:crypto.randomUUID(),message:'Fixture run completed; no provider call was made.'};}
`,
);
await write(
  "app/layout.tsx",
  `export {default,metadata} from '../../../src/app/layout';`,
);
for (const route of ["chains", "runs"])
  await write(
    `app/${route}/page.tsx`,
    `import {StudioPage} from '../../StudioPage';export const dynamic='force-dynamic';export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){return <StudioPage query={await searchParams} mode="${route}"/>;}`,
  );
await write(
  "playwright.config.ts",
  `import {defineConfig} from '@playwright/test';export default defineConfig({testDir:'./specs',workers:1,timeout:120000,expect:{timeout:15000},reporter:'list',outputDir:${JSON.stringify(resolve(root, "test-results/studio-ui"))},use:{baseURL:'http://127.0.0.1:${port}',channel:process.env.PUNNETT_BROWSER_CHANNEL||undefined,headless:true}});`,
);
await write(
  "specs/studio.spec.ts",
  `import {test,expect} from '@playwright/test';import AxeBuilder from '@axe-core/playwright';
test('inline editing: steps, order, chain details, create and delete, accessible at all widths',async({page})=>{
const titles=page.locator('.steps .step h3');
await page.goto('/chains',{waitUntil:'networkidle'});
await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'.vercel/studio-desktop.png',fullPage:true});
await page.getByRole('button',{name:'Edit Describe',exact:true}).click();
await page.getByRole('textbox',{name:'User prompt',exact:true}).fill('Updated prompt fixture');
await page.getByRole('combobox',{name:'Model',exact:true}).selectOption('00110000-0000-4000-8000-000000000099');
await page.getByRole('button',{name:'Save step',exact:true}).click();
await expect(page.getByRole('button',{name:'Save step',exact:true})).toHaveCount(0);
await expect(page.getByRole('button',{name:'Edit Describe',exact:true})).toBeFocused();
await page.reload({waitUntil:'networkidle'});await expect(page.locator('.steps .prompt').first()).toHaveText('Updated prompt fixture');
await page.getByRole('button',{name:'Edit Describe',exact:true}).click();await expect(page.getByRole('combobox',{name:'Model',exact:true})).toHaveValue('00110000-0000-4000-8000-000000000099');await page.getByRole('button',{name:'Cancel',exact:true}).click();
await page.getByRole('button',{name:'Move Describe down',exact:true}).click();
await expect(titles).toHaveText([/Caption draft$/,/Describe$/]);
await page.reload({waitUntil:'networkidle'});await expect(titles).toHaveText([/Caption draft$/,/Describe$/]);
await page.getByRole('button',{name:'Move Describe up',exact:true}).click();
await expect(titles).toHaveText([/Describe$/,/Caption draft$/]);
await page.getByRole('button',{name:'Edit chain name and description',exact:true}).click();
await page.getByRole('textbox',{name:'Name',exact:true}).fill('Renamed fixture');
await page.getByRole('button',{name:'Save',exact:true}).click();
await expect(page.getByRole('heading',{level:1})).toHaveText('Renamed fixture');
await page.reload({waitUntil:'networkidle'});await expect(page.getByRole('heading',{level:1})).toHaveText('Renamed fixture');
await page.getByRole('button',{name:'New chain',exact:true}).click();
await page.getByRole('textbox',{name:'Name',exact:true}).fill('New fixture chain');
await page.getByRole('button',{name:'Create chain',exact:true}).click();
await expect(page.getByRole('heading',{level:1})).toHaveText('New fixture chain');
await expect(page.getByRole('region',{name:'Chain diagram'})).toHaveCount(0);
await page.getByRole('button',{name:'Add step 1',exact:true}).click();
await page.getByRole('textbox',{name:'Step name',exact:true}).fill('New caption step');
await page.getByRole('textbox',{name:'User prompt',exact:true}).fill('Write captions');
await page.getByRole('combobox',{name:'Output',exact:true}).selectOption('captions');
await page.getByRole('button',{name:'Add step',exact:true}).click();
await expect(titles).toHaveText([/New caption step$/]);
await page.reload({waitUntil:'networkidle'});await expect(titles).toHaveText([/New caption step$/]);
await page.getByRole('button',{name:'Delete New caption step',exact:true}).click();
await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();
await expect(page.getByRole('button',{name:'Delete New caption step',exact:true})).toBeFocused();
await page.getByRole('button',{name:'Delete New caption step',exact:true}).click();
await page.getByRole('dialog').getByRole('button',{name:'Delete',exact:true}).click();
await expect(page.getByRole('dialog')).toHaveCount(0);
await page.reload({waitUntil:'networkidle'});await expect(page.locator('.steps .step')).toHaveCount(0);
await page.getByRole('button',{name:'Delete chain',exact:true}).click();
await page.getByRole('dialog').getByRole('button',{name:'Delete',exact:true}).click();
await expect(page.getByRole('dialog')).toHaveCount(0);
await expect(page.locator('.chain-nav li')).toHaveCount(1);
for(const theme of ['night','lights-on']){await page.getByLabel('Appearance').selectOption(theme);
for(const width of [320,768,1440]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(scan.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);if(width===320)await page.screenshot({path:'.vercel/studio-'+theme+'-mobile.png',fullPage:true});}}
});`,
);
await write(
  "specs/flow.spec.ts",
  `import {test,expect} from '@playwright/test';
test('diagram: drag a step to reorder, order persists, past runs show the chain name',async({page})=>{
const titles=page.locator('.steps .step h3');
await page.goto('/chains',{waitUntil:'networkidle'});
const map=page.getByRole('region',{name:'Chain diagram',exact:true});
const node=(name:string)=>map.locator('.react-flow__node').filter({hasText:name});
async function drag(from:string,to:string){const a=await node(from).boundingBox(),b=await node(to).boundingBox();if(!a||!b)throw new Error('Step nodes were not measured');
await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2+20,b.y+b.height/2,{steps:15});await page.mouse.up();}
await drag('Describe','Caption draft');
await expect(titles).toHaveText([/Caption draft$/,/Describe$/]);
await page.reload({waitUntil:'networkidle'});await expect(titles).toHaveText([/Caption draft$/,/Describe$/]);
await drag('Describe','Caption draft');
await expect(titles).toHaveText([/Describe$/,/Caption draft$/]);
await page.getByRole('link',{name:'Past runs',exact:true}).click();
await expect(page).toHaveURL(/\\/runs\\?chain=/);
await expect(page.getByRole('heading',{level:1})).toHaveText('Runs of Fixture chain');
});`,
);
const env = { ...process.env };
await write(
  "specs/batch.spec.ts",
  `import {test,expect} from '@playwright/test';import {readFile} from 'node:fs/promises';
test('test images run one at a time and stop before the third image on failure',async({page})=>{
await page.route('**/asset/**',route=>route.fulfill({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="80"><rect width="100" height="80" fill="gray"/></svg>'}));
await page.goto('/chains',{waitUntil:'networkidle'});
for(const n of [1,2,3])await page.getByLabel('Test image '+n,{exact:true}).check();
await page.getByRole('button',{name:'Run on 3 images',exact:true}).click();
await expect(page.locator('.test').getByRole('alert')).toContainText('Fixture failure');
await expect(page.getByRole('button',{name:'Run on 3 images',exact:true})).toBeEnabled();
const calls=JSON.parse(await readFile(${callsPath},'utf8')) as {image_id:string;request_id:string;chain_id:string;use_mix:string}[];
expect(calls.map(c=>c.image_id)).toEqual(['00110000-0000-4000-8000-000000000001','00110000-0000-4000-8000-000000000002']);
expect(calls[0].request_id).not.toBe(calls[1].request_id);expect(calls.every(c=>c.chain_id==='${chainId}'&&c.use_mix==='false')).toBe(true);
});`,
);
delete env.GEMINI_API_KEY;
async function processExit(args) {
  const child = spawn(process.execPath, args, {
    cwd: root,
    env,
    stdio: "inherit",
  });
  return new Promise((resolveExit) => child.once("exit", resolveExit));
}
assert.equal(
  await processExit([
    resolve("node_modules/next/dist/bin/next"),
    "build",
    folder,
    "--webpack",
  ]),
  0,
);
const server = spawn(
  process.execPath,
  [
    resolve("node_modules/next/dist/bin/next"),
    "start",
    folder,
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  { cwd: root, env, stdio: "ignore" },
);
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try {
      if (
        (
          await fetch(`http://127.0.0.1:${port}/chains`, {
            signal: AbortSignal.timeout(1000),
          })
        ).ok
      ) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  assert.ok(ready, "Fixture did not start");
  assert.equal(
    await processExit([
      resolve("node_modules/@playwright/test/cli.js"),
      "test",
      "--config",
      resolve(folder, "playwright.config.ts"),
    ]),
    0,
  );
  console.log(
    "PASS: actual prompt UI fixture. No provider call or real database mutation.",
  );
} finally {
  if (server.exitCode === null) server.kill();
}

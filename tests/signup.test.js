import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/signup.js';
const payload = {id:'11111111-1111-4111-8111-111111111111',role:'client',email:'test@example.com'};
function response() {
  return {headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(body){this.body=body;return this;}};
}
test('validates before forwarding and acknowledges only confirmed writes', async () => {
  process.env.GOOGLE_SHEETS_WEBHOOK_URL='https://example.com/receiver';
  process.env.GOOGLE_SHEETS_TOKEN='test-token';
  const original=globalThis.fetch;
  let calls=0;
  globalThis.fetch=async (_url,options)=>{calls++;const forwarded=JSON.parse(options.body);assert.equal(forwarded.token,'test-token');assert.equal(forwarded.instagram,'');return {ok:true,json:async()=>({ok:true})};};
  try {
    for (const body of [{...payload,email:'bad'},{...payload,role:'other'},{...payload,role:'stylist'},null,{...payload,website:'spam'}]) {
      const res=response(); await handler({method:'POST',headers:{},body},res); assert.equal(res.code,400);
    }
    assert.equal(calls,0);
    const forbidden=response();await handler({method:'POST',headers:{origin:'https://unrelated.example'},body:payload},forbidden);assert.equal(forbidden.code,403);
    const valid=response();await handler({method:'POST',headers:{origin:'https://etto.ai'},body:payload},valid);assert.equal(valid.code,200);assert.deepEqual(valid.body,{ok:true});
    globalThis.fetch=async()=>({ok:true,json:async()=>({ok:false})});
    const rejected=response();await handler({method:'POST',headers:{},body:payload},rejected);assert.equal(rejected.code,502);
    globalThis.fetch=async()=>{throw new Error('Timeout');};
    const timeout=response();await handler({method:'POST',headers:{},body:payload},timeout);assert.equal(timeout.code,502);
    delete process.env.GOOGLE_SHEETS_TOKEN;
    const unavailable=response();await handler({method:'POST',headers:{},body:payload},unavailable);assert.equal(unavailable.code,503);
  } finally {globalThis.fetch=original;delete process.env.GOOGLE_SHEETS_WEBHOOK_URL;delete process.env.GOOGLE_SHEETS_TOKEN;}
});
const SHEET='https://example.com/receiver', KO='https://ko.example/etto/api/signup';
const acked={ok:true,json:async()=>({ok:true})};
async function withWaitlist(fn, {sheet=acked, ko=acked}={}) {
  const original=globalThis.fetch, originalError=console.error, calls=[], errors=[];
  process.env.GOOGLE_SHEETS_WEBHOOK_URL=SHEET;process.env.GOOGLE_SHEETS_TOKEN='test-token';
  process.env.KO_X_ETTO_SIGNUP_URL=KO;process.env.KO_X_ETTO_INGEST_TOKEN='ko-secret';
  globalThis.fetch=async (url,options)=>{calls.push({url,options,body:JSON.parse(options.body)});const r=url===SHEET?sheet:ko;if(r instanceof Error)throw r;return r;};
  console.error=(...args)=>errors.push(args.map(String).join(' '));
  try {await fn({calls,errors,ko:()=>calls.filter(c=>c.url===KO)});}
  finally {globalThis.fetch=original;console.error=originalError;for (const k of ['GOOGLE_SHEETS_WEBHOOK_URL','GOOGLE_SHEETS_TOKEN','KO_X_ETTO_SIGNUP_URL','KO_X_ETTO_INGEST_TOKEN']) delete process.env[k];}
}
test('copies a confirmed client application to the ko x etto waitlist', () => withWaitlist(async ({calls,ko}) => {
  const res=response();await handler({method:'POST',headers:{},body:{...payload,instagram:'@ignored'}},res);
  assert.equal(res.code,200);assert.deepEqual(res.body,{ok:true});
  assert.deepEqual(calls.map(c=>c.url),[SHEET,KO]);
  const [c]=ko();assert.equal(c.options.method,'POST');assert.equal(c.options.headers.Authorization,'Bearer ko-secret');
  assert.equal(c.options.headers['Content-Type'],'application/json');assert.ok(c.options.signal instanceof AbortSignal);
  assert.deepEqual(c.body,{role:'looking',email:'test@example.com',source:'concierge'});
}));
test('copies a stylist with their instagram handle', () => withWaitlist(async ({ko}) => {
  const res=response();await handler({method:'POST',headers:{},body:{...payload,role:'stylist',instagram:' @nis.styles '}},res);
  assert.equal(res.code,200);assert.deepEqual(ko()[0].body,{role:'creating',email:'test@example.com',instagram:'@nis.styles',source:'concierge'});
}));
test('never copies when the sheet write is not confirmed', async () => {
  for (const sheet of [{ok:true,json:async()=>({ok:false})},{ok:false,json:async()=>({})},new Error('Timeout'),{ok:true,json:async()=>{throw new Error('bad json');}}]) {
    await withWaitlist(async ({ko}) => {
      const res=response();await handler({method:'POST',headers:{},body:payload},res);
      assert.equal(res.code,502);assert.equal(ko().length,0);
    }, {sheet});
  }
});
test('never copies spam or invalid submissions', () => withWaitlist(async ({calls}) => {
  for (const body of [{...payload,website:'spam'},{...payload,email:'bad'}]) {const res=response();await handler({method:'POST',headers:{},body},res);assert.equal(res.code,400);}
  assert.equal(calls.length,0);
}));
test('a failed waitlist copy still confirms the application and logs no email or token', async () => {
  for (const ko of [{ok:false,status:500,json:async()=>({})},{ok:true,json:async()=>({ok:false})},new Error('The operation was aborted due to timeout'),{ok:true,json:async()=>{throw new Error('bad json');}}]) {
    await withWaitlist(async ({ko:koCalls,errors}) => {
      const res=response();await handler({method:'POST',headers:{},body:payload},res);
      assert.equal(res.code,200);assert.deepEqual(res.body,{ok:true});assert.equal(koCalls().length,1);
      assert.equal(errors.length,1);assert.ok(!/test@example\.com|ko-secret|test-token/.test(errors[0]),errors[0]);
    }, {ko});
  }
});
test('skips the waitlist copy silently when either env var is missing', async () => {
  for (const drop of ['KO_X_ETTO_SIGNUP_URL','KO_X_ETTO_INGEST_TOKEN']) {
    await withWaitlist(async ({calls,errors}) => {
      delete process.env[drop];
      const res=response();await handler({method:'POST',headers:{},body:payload},res);
      assert.equal(res.code,200);assert.deepEqual(calls.map(c=>c.url),[SHEET]);assert.equal(errors.length,0);
    });
  }
});

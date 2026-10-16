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

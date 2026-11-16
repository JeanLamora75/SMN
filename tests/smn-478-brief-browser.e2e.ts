/** Manual qualification on a disposable installed SMN, not part of ordinary unit-test discovery.
 * Supply an ephemeral authenticated test-account cookie; never print it.
 */
import test from "node:test";
import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";
const base=process.env.SMN478_BROWSER_URL;
const executablePath=process.env.SMN478_BROWSER_CHROME;
const cookie=process.env.SMN478_TEST_COOKIE;
const cycle=process.env.SMN478_TEST_CYCLE_ID;
const mode=process.env.SMN478_TEST_MODE??"scrum";
if(!base||!executablePath||!cookie||!cycle||
 !/^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/.test(base)||
 !/^[a-f0-9-]{36}$/i.test(cycle))throw Error(
  "smn478-browser-requires-disposable-local-smn-chromium-test-cookie-and-cycle");
test("SMN-478: authenticated template edit, keyboard, responsive preview and privacy",{timeout:180000},async()=>{
 const browser=await puppeteer.launch({executablePath,headless:true});
 try{
  const page=await browser.newPage();
  const eq=cookie.indexOf("=");
  if(eq<=0)throw Error("smn478-bad-test-cookie");
  await page.setCookie({url:base,name:cookie.slice(0,eq),value:cookie.slice(eq+1)});
  await page.goto(base+"/app/admin/ai-briefs/templates",{waitUntil:"networkidle2"});
  await page.waitForSelector("#brief-template-choice",{timeout:12000});
  await page.select("#brief-template-choice","new");
  await page.type("#brief-name","SMN478 e2e - unsaved");
  await page.type("#brief-prompt","Review {{TEAM_NAME}}");
  const content=await page.$eval("#brief-prompt",el=>(el as HTMLTextAreaElement).value);
  assert.equal(content,"Review {{TEAM_NAME}}");
  // Leave without saving: the test must not mutate the installed database.
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  await page.goto(base+"/app/admin/ai-briefs/prepare?"+
   new URLSearchParams({mode,id:cycle}).toString(),{waitUntil:"networkidle2"});
  await page.waitForSelector("#brief-prompt",{timeout:12000});
  const buttons=await page.$$('[aria-label="Mode de travail"] button');
  assert.equal(buttons.length,2);
  assert.equal(await page.$eval("#brief-prompt",el=>getComputedStyle(el).display!=="none"),true);
  await buttons[1].click();
  const pressed=await page.$eval('[aria-label="Mode de travail"] button:nth-child(2)',
   el=>el.getAttribute("aria-pressed"));
  assert.equal(pressed,"true");
  await page.keyboard.press("Tab");
  assert.ok(await page.$("#brief-txt-preview"));
  await buttons[0].click();
  const switched=await page.$eval('[aria-label="Mode de travail"] button:first-child',
   el=>el.getAttribute("aria-pressed"));
  assert.equal(switched,"true");
  const privacy=await page.$("#brief-privacy-reviewed");
  if(privacy)assert.equal(await page.$eval("#brief-privacy-reviewed",el=>(el as HTMLInputElement).checked),false);
 }finally{await browser.close();}
});

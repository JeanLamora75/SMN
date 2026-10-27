import {findPdfChrome} from "./chrome-path";
import {validateFinalPdf} from "./pdf-archive-contract";
const MAX_PDF_BYTES=20*1024*1024;
export async function generateFrozenPdf(url:string,sessionCookie:{name:string;value:string}):Promise<Buffer>{
 const parsed=new URL(url);
 if(parsed.protocol!=="http:"||!["127.0.0.1","localhost"].includes(parsed.hostname)||!(/^\/app\/admin\/sprints\/[a-f0-9-]{36}\/report\/preview$/.test(parsed.pathname)||/^\/app\/admin\/kanban-periods\/[a-f0-9-]{36}\/report\/frozen$/.test(parsed.pathname))||!/^[a-f0-9-]{36}$/i.test(parsed.searchParams.get("reference")??"")||(parsed.searchParams.has("teamId")&&!/^[a-f0-9-]{36}$/i.test(parsed.searchParams.get("teamId")??"")))throw Error("pdf-url-invalid");
 const chromePath=await findPdfChrome();
 if(!chromePath)throw Error("pdf-browser-unavailable");
 const moduleName="puppeteer-core";
 const puppeteer=(await import(moduleName)).default;
 const browser=await puppeteer.launch({executablePath:chromePath,headless:true,args:["--no-first-run","--no-default-browser-check"]});
 try{
 const page=await browser.newPage();
 try{
 await page.setCookie({name:sessionCookie.name,value:sessionCookie.value,url:parsed.origin,httpOnly:true});
 await page.setRequestInterception(true);
 page.on("request",(request:any)=>{
  const target=new URL(request.url());
  if(target.origin===parsed.origin||target.protocol==="data:")request.continue();
  else request.abort();
 });
 const result=await page.goto(parsed.toString(),{waitUntil:"networkidle0",timeout:20000});
 if(result?.status()!==200)throw Error("pdf-render-failed");
 if(!await page.$(".smn-report-printable article"))throw Error("pdf-render-failed");
 await page.emulateMediaType("print");
 const pdf=Buffer.from(await page.pdf({format:"A4",printBackground:true,preferCSSPageSize:true,timeout:20000}));
 if(pdf.length>MAX_PDF_BYTES||!validateFinalPdf(pdf))throw Error("pdf-invalid");
 return pdf;
 }finally{await page.close();}
 }finally{await browser.close();}
}

import {detectChrome} from "./report-chrome.mjs";
const chrome=await detectChrome();
if(!chrome.ok){
 console.error("PDF_CHROME_NOT_FOUND: configure SMN_CHROME_PATH with the full Chrome executable path.");
 process.exitCode=1;
}else{
 console.log("PDF_CHROME_FOUND: "+chrome.path);
 if(process.argv.includes("--smoke")){
  try{
   const {default:puppeteer}=await import("puppeteer-core");
   const browser=await puppeteer.launch({executablePath:chrome.path,headless:true,args:["--no-first-run","--no-default-browser-check"]});
   try{
    const page=await browser.newPage();
    await page.setContent("<!doctype html><html lang='fr'><head><meta charset='utf-8'></head><body><h1>SMN – vérification PDF</h1><p>Essai local sans données utilisateur.</p></body></html>",{waitUntil:"load"});
    const pdf=await page.pdf({format:"A4",printBackground:true,preferCSSPageSize:true});
    if(!Buffer.from(pdf).subarray(0,5).equals(Buffer.from("%PDF-")))throw Error("PDF_INVALID_HEADER");
    console.log("PDF_SMOKE_OK: "+pdf.byteLength+" bytes (not saved)");
   }finally{await browser.close();}
  }catch(e){
   console.error("PDF_SMOKE_FAILED: "+(e instanceof Error?e.name:"unknown")+". Check puppeteer-core installation and local Chrome policy.");
   process.exitCode=1;
  }
 }
}

import {access,constants} from "node:fs/promises";
import {join} from "node:path";
export async function findPdfChrome(){
 const explicit=process.env.SMN_CHROME_PATH?.trim();
 const paths=explicit?[explicit]:process.platform==="win32"?[
 process.env.PROGRAMFILES&&join(process.env.PROGRAMFILES,"Google","Chrome","Application","chrome.exe"),
 process.env["PROGRAMFILES(X86)"]&&join(process.env["PROGRAMFILES(X86)"],"Google","Chrome","Application","chrome.exe"),
 process.env.LOCALAPPDATA&&join(process.env.LOCALAPPDATA,"Google","Chrome","Application","chrome.exe")
 ]:process.platform==="darwin"?["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]:
 ["/usr/bin/google-chrome","/usr/bin/google-chrome-stable","/usr/bin/chromium","/usr/bin/chromium-browser"];
 for(const path of paths){if(!path)continue;try{await access(path,constants.X_OK);return path;}catch{}}
 return null;
}

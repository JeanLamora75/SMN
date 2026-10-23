import {access,constants} from "node:fs/promises";
import {join} from "node:path";
export function chromeCandidates(env=process.env,platform=process.platform){
 const explicit=env.SMN_CHROME_PATH?.trim();
 if(explicit)return [explicit];
 if(platform==="win32"){
  return [
   env.PROGRAMFILES&&join(env.PROGRAMFILES,"Google","Chrome","Application","chrome.exe"),
   env["PROGRAMFILES(X86)"]&&join(env["PROGRAMFILES(X86)"],"Google","Chrome","Application","chrome.exe"),
   env.LOCALAPPDATA&&join(env.LOCALAPPDATA,"Google","Chrome","Application","chrome.exe"),
  ].filter(Boolean);
 }
 if(platform==="darwin")return ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"];
 return ["/usr/bin/google-chrome","/usr/bin/google-chrome-stable","/opt/google/chrome/chrome","/usr/bin/chromium","/usr/bin/chromium-browser"];
}
export async function detectChrome(env=process.env,platform=process.platform){
 for(const candidate of chromeCandidates(env,platform)){
  try{await access(candidate,constants.X_OK);return {ok:true,path:candidate};}catch{}
 }
 return {ok:false,reason:"chrome-not-found"};
}

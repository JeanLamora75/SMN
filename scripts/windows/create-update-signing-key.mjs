// One-time local provisioning; never run in CI and never commit any secret.
// Node.js 24 is enough; no admin privileges, OpenSSL or IDE needed.
import {generateKeyPairSync,createHash} from "node:crypto";
import {mkdir,writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
const destination=path.resolve(process.argv[2]??path.join(os.homedir(),"SMN-Update-Signing"));
if(process.env.GITHUB_ACTIONS==="true")throw Error("Génération de la clé privée interdite dans GitHub Actions");
await mkdir(destination,{recursive:true,mode:0o700});
const {privateKey,publicKey}=generateKeyPairSync("ed25519");
const privatePem=privateKey.export({format:"pem",type:"pkcs8"});
const publicPem=publicKey.export({format:"pem",type:"spki"});
const files=[
 ["smn-update-private.pem",privatePem],
 ["SMN_UPDATE_SIGNING_KEY_PEM_B64.txt",Buffer.from(privatePem).toString("base64")],
 ["smn-update-public.pem",publicPem]
];
for(const [name,content] of files){
  const file=path.join(destination,name);
  await writeFile(file,content,{flag:"wx",mode:0o600});
}
const fingerprint=createHash("sha256").update(publicKey.export({format:"der",type:"spki"})).digest("hex");
console.log("Clés créées localement dans : "+destination);
console.log("Empreinte publique SHA-256 : "+fingerprint);
console.log("Configurer dans GitHub Actions le secret SMN_UPDATE_SIGNING_KEY_PEM_B64");
console.log("en copiant la seule valeur du fichier SMN_UPDATE_SIGNING_KEY_PEM_B64.txt.");
console.log("Conserver les deux fichiers privés hors du dépôt et d'un répertoire partagé.");

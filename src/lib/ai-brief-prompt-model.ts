/** Minimal storage contract for freely written AI prompt models. */
export type PromptModelDraft = {
  title:string;
  description:string;
  promptText:string;
};

export const PROMPT_TEXT_LIMIT=200000;

export function validatePromptModelDraft(value:unknown):value is PromptModelDraft{
  if(!value||typeof value!=="object"||Array.isArray(value))return false;
  const data=value as Record<string,unknown>;
  return typeof data.title==="string"&&data.title.trim().length>0&&data.title.length<=120&&
    typeof data.description==="string"&&data.description.length<=500&&
    typeof data.promptText==="string"&&data.promptText.trim().length>0&&
    data.promptText.length<=PROMPT_TEXT_LIMIT&&
    !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(data.promptText);
}

"use client";
import {createContext,useCallback,useContext,type ReactNode} from "react";
import {translate,type TranslationKey,type TranslationParams} from "./catalog";
import type {Language} from "@/lib/language";
const LocaleContext=createContext<Language>("fr");
export function LocaleProvider({locale,children}:{locale:Language;children:ReactNode}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}
export function useLocale():Language{return useContext(LocaleContext);}
export function useTranslation(){
  const locale=useLocale();
  return useCallback((key:TranslationKey,params?:TranslationParams)=>translate(locale,key,params),[locale]);
}

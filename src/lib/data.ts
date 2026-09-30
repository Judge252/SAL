import type { Localized } from "./types";
export const localized = (ar:string,en:string,he:string):Localized => ({ar,en,he});
export const languageNames:Record<string,string> = {ar:"العربية",en:"English",he:"עברית"};

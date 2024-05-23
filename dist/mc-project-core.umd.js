(function(a,l){typeof exports=="object"&&typeof module!="undefined"?l(exports,require("path-browserify"),require("json5"),require("bridge-common-utils")):typeof define=="function"&&define.amd?define(["exports","path-browserify","json5","bridge-common-utils"],l):(a=typeof globalThis!="undefined"?globalThis:a||self,l(a.MCProjectCore={},a.pathBrowserify,a.json5,a.bridgeCommonUtils))})(this,function(a,l,F,M){"use strict";function w(p){return p&&typeof p=="object"&&"default"in p?p:{default:p}}var R=w(F);const j={behaviorPack:"./BP",resourcePack:"./RP",skinPack:"./SP",worldTemplate:"./WT"};class E{constructor(t){this.basePath=t,this.data={}}async refreshConfig(){this.data=await this.readConfig()}async setup(){await this.refreshConfig()}get(){return this.data}getRelativePackRoot(t){var e,s;return(s=(e=this.data.packs)==null?void 0:e[t])!=null?s:j[t]}getAbsolutePackRoot(t){return this.resolvePackPath(t)}resolvePackPath(t,e){return!e&&!t?this.basePath:!t&&e?l.join(this.basePath,e):!e&&t?l.join(this.basePath,this.getRelativePackRoot(t)):l.join(this.basePath,`${this.getRelativePackRoot(t)}/${e}`)}getAvailablePackPaths(){var e;const t=[];for(const s of Object.keys((e=this.data.packs)!=null?e:{}))t.push(this.resolvePackPath(s));return t}getAvailablePacks(){var e;const t={};for(const s in(e=this.data.packs)!=null?e:{})t[s]=this.resolvePackPath(s);return t}async save(){await this.writeConfig(this.data)}}class _{constructor(t){this.projectConfig=t,this.packTypes=[],this.extensionPackTypes=new Set}setProjectConfig(t){this.projectConfig=t}get all(){return this.packTypes.concat(...Array.from(this.extensionPackTypes.values()))}getFromId(t){return this.all.find(e=>e.id===t)}get(t,e=!1){var r;let s=(r=this.projectConfig)==null?void 0:r.getAvailablePacks();(!s||e)&&(s=Object.fromEntries(Object.keys(j).map(o=>{var d;const f=(d=this.projectConfig)==null?void 0:d.resolvePackPath(o);return f?[o,f]:null}).filter(o=>o!==null)));for(const o in s)if(t.startsWith(s[o]))return this.getFromId(o)}getId(t){var e,s;return(s=(e=this.get(t))==null?void 0:e.id)!=null?s:"unknown"}addExtensionPackType(t){return this.extensionPackTypes.add(t),{dispose:()=>this.extensionPackTypes.delete(t)}}}class S{constructor(t,e){this.projectConfig=t,this.isMatch=e,this.pluginFileTypes=new Set,this._fileTypes=[]}get fileTypes(){return this._fileTypes}set fileTypes(t){this._fileTypes=t.sort((e,s)=>e.add==="post"&&s.add!=="post"?1:e.add!=="post"&&s.add==="post"||e.add==="pre"&&s.add!=="pre"?-1:e.add!=="pre"&&s.add==="pre"?1:0)}get all(){return this.fileTypes.concat([...this.pluginFileTypes.values()])}setProjectConfig(t){this.projectConfig=t}addPluginFileType(t){return this.pluginFileTypes.add(t),{dispose:()=>this.pluginFileTypes.delete(t)}}getPluginFileTypes(){return[...this.pluginFileTypes.values()]}setPluginFileTypes(t=[]){this.pluginFileTypes.clear(),t.forEach(e=>this.pluginFileTypes.add(e))}get(t,e,s=!0){var o,f,d,g,P,i,c,u,y,h,k,C,A;const r=t?l.extname(t):null;if(!!r)for(const n of this.all){if(e!==void 0&&e===n.id)return n;if(!t)continue;const m=((o=n.detect)==null?void 0:o.packType)===void 0?[]:Array.isArray((f=n.detect)==null?void 0:f.packType)?(d=n.detect)==null?void 0:d.packType:[(g=n.detect)==null?void 0:g.packType],b=(P=n.detect)==null?void 0:P.fileExtensions,W=!!((i=n.detect)!=null&&i.scope),O=Array.isArray((c=n.detect)==null?void 0:c.scope)?(u=n.detect)==null?void 0:u.scope:[(y=n.detect)==null?void 0:y.scope],q=!!((h=n.detect)!=null&&h.matcher),x=Array.isArray((k=n.detect)==null?void 0:k.matcher)?(C=n.detect)==null?void 0:C.matcher:[(A=n.detect)==null?void 0:A.matcher];if(!(s&&b&&!b.includes(r)))if(W){if(this.prefixMatchers(m,O).some(v=>t.startsWith(v)))return n}else if(q){const v=this.prefixMatchers(m,x.filter(T=>!T.startsWith("!"))),I=this.prefixMatchers(m,x.filter(T=>T.startsWith("!")).map(T=>T.slice(1)));if(this.isMatch(t,v)&&!this.isMatch(t,I))return n}else throw console.log(n),new Error('Invalid file definition, no "detect" properties')}}prefixMatchers(t,e){if(!this.projectConfig)return[];if(t.length===0)return e.map(r=>this.projectConfig.resolvePackPath(void 0,r));const s=[];for(const r of t)for(const o of e)s.push(this.projectConfig.resolvePackPath(r,o));return s}getIds(){const t=[];for(const e of this.all)t.push(e.id);return t}async guessFolder(t){var P;const e=(i,c)=>{var h,k;let u=Array.isArray(i)?i[0]:i;u.endsWith("/")||(u+="/");const y=(k=(h=this.projectConfig)==null?void 0:h.getAbsolutePackRoot(c))!=null?k:"./unknown";return l.join(y,u)},s=`.${t.name.split(".").pop()}`,r=this.all.filter(({detect:i})=>{var c;return!i||!i.scope?!1:(c=i.fileExtensions)==null?void 0:c.includes(s)}),o=r.length===1,f=s!==".json"&&r.length>0;if(o||f){const{detect:i}=r[0];return e(i.scope,Array.isArray(i.packType)?i.packType[0]:(P=i.packType)!=null?P:"behaviorPack")}if(s!==".json")return null;const d=await t.getFile();let g;try{g=R.default.parse(await d.text())}catch{return null}for(const{type:i,detect:c}of r){if(typeof i=="string"&&i!=="json")continue;const{scope:u,fileContent:y,packType:h="behaviorPack"}=c!=null?c:{};if(!(!u||!y)&&!!M.hasAnyPath(g,y))return e(u,Array.isArray(h)?h[0]:h)}return null}getId(t){var e,s;return(s=(e=this.get(t))==null?void 0:e.id)!=null?s:"unknown"}isJsonFile(t){var s,r;const e=(r=(s=this.get(t))==null?void 0:s.meta)==null?void 0:r.language;return e?e==="json":t.endsWith(".json")}}a.FileType=S,a.PackType=_,a.ProjectConfig=E,a.defaultPackPaths=j,Object.defineProperties(a,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}})});

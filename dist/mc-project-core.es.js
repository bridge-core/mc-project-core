import { extname, join, resolve } from "path-browserify";
import { isMatch } from "micromatch";
import json5 from "json5";
var getRandomValues;
var rnds8 = new Uint8Array(16);
function rng() {
  if (!getRandomValues) {
    getRandomValues = typeof crypto !== "undefined" && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || typeof msCrypto !== "undefined" && typeof msCrypto.getRandomValues === "function" && msCrypto.getRandomValues.bind(msCrypto);
    if (!getRandomValues) {
      throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
    }
  }
  return getRandomValues(rnds8);
}
var REGEX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;
function validate(uuid) {
  return typeof uuid === "string" && REGEX.test(uuid);
}
var byteToHex = [];
for (var i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).substr(1));
}
function stringify(arr) {
  var offset = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
  var uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
  if (!validate(uuid)) {
    throw TypeError("Stringified UUID is invalid");
  }
  return uuid;
}
function v4(options, buf, offset) {
  options = options || {};
  var rnds = options.random || (options.rng || rng)();
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  if (buf) {
    offset = offset || 0;
    for (var i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }
    return buf;
  }
  return stringify(rnds);
}
class PackType {
  constructor(projectConfig) {
    this.projectConfig = projectConfig;
    this.packTypes = [];
    this.extensionPackTypes = new Map();
  }
  get all() {
    return this.packTypes.concat(...Array.from(this.extensionPackTypes.values()));
  }
  getFromId(packId) {
    return this.all.find((packType) => packType.id === packId);
  }
  get(filePath) {
    const packTypes = this.projectConfig.getAvailablePacks();
    for (const packId in packTypes) {
      if (filePath.startsWith(packTypes[packId])) {
        return this.getFromId(packId);
      }
    }
  }
  getId(filePath) {
    var _a, _b;
    return (_b = (_a = this.get(filePath)) == null ? void 0 : _a.id) != null ? _b : "unknown";
  }
  addExtensionPackType(packType) {
    const id = v4();
    this.extensionPackTypes.set(id, packType);
    return {
      dispose: () => this.extensionPackTypes.delete(id)
    };
  }
}
class FileType {
  constructor(projectConfig) {
    this.projectConfig = projectConfig;
    this.pluginFileTypes = new Set();
    this.fileTypes = [];
  }
  get all() {
    return this.fileTypes.concat([...this.pluginFileTypes.values()]);
  }
  setProjectConfig(projectConfig) {
    this.projectConfig = projectConfig;
  }
  addPluginFileType(fileDef) {
    this.pluginFileTypes.add(fileDef);
    return {
      dispose: () => this.pluginFileTypes.delete(fileDef)
    };
  }
  getPluginFileTypes() {
    return [...this.pluginFileTypes.values()];
  }
  setPluginFileTypes(fileDefs = []) {
    this.pluginFileTypes.clear();
    fileDefs.forEach((fileDef) => this.pluginFileTypes.add(fileDef));
  }
  get(filePath, searchFileType) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
    const extension = filePath ? extname(filePath) : null;
    for (const fileType of this.all) {
      if (searchFileType !== void 0 && searchFileType === fileType.id)
        return fileType;
      else if (!filePath)
        continue;
      const packTypes = ((_a = fileType.detect) == null ? void 0 : _a.packType) === void 0 ? [] : Array.isArray((_b = fileType.detect) == null ? void 0 : _b.packType) ? (_c = fileType.detect) == null ? void 0 : _c.packType : [(_d = fileType.detect) == null ? void 0 : _d.packType];
      const fileExtensions = (_e = fileType.detect) == null ? void 0 : _e.fileExtensions;
      const hasScope = !!((_f = fileType.detect) == null ? void 0 : _f.scope);
      const scope = Array.isArray((_g = fileType.detect) == null ? void 0 : _g.scope) ? (_h = fileType.detect) == null ? void 0 : _h.scope : [(_i = fileType.detect) == null ? void 0 : _i.scope];
      const hasMatcher = !!((_j = fileType.detect) == null ? void 0 : _j.matcher);
      const matcher = Array.isArray((_k = fileType.detect) == null ? void 0 : _k.matcher) ? (_l = fileType.detect) == null ? void 0 : _l.matcher : [(_m = fileType.detect) == null ? void 0 : _m.matcher];
      if (fileExtensions && extension && !fileExtensions.includes(extension))
        continue;
      if (hasScope) {
        if (this.prefixMatchers(packTypes, scope).some((scope2) => filePath.startsWith(scope2)))
          return fileType;
      } else if (hasMatcher) {
        if (isMatch(filePath, this.prefixMatchers(packTypes, matcher))) {
          return fileType;
        }
      } else {
        console.log(fileType);
        throw new Error(`Invalid file definition, no "detect" properties`);
      }
    }
  }
  prefixMatchers(packTypes, matchers) {
    if (!this.projectConfig)
      return [];
    if (packTypes.length === 0)
      return matchers.map((matcher) => this.projectConfig.resolvePackPath(void 0, matcher));
    const prefixed = [];
    for (const packType of packTypes) {
      for (const matcher of matchers) {
        prefixed.push(this.projectConfig.resolvePackPath(packType, matcher));
      }
    }
    return prefixed;
  }
  getIds() {
    const ids = [];
    for (const fileType of this.all) {
      ids.push(fileType.id);
    }
    return ids;
  }
  async guessFolder(fileHandle) {
    var _a;
    const getStartPath = (scope) => {
      let startPath = Array.isArray(scope) ? scope[0] : scope;
      if (!startPath.endsWith("/"))
        startPath += "/";
      return startPath;
    };
    const extension = `.${fileHandle.name.split(".").pop()}`;
    for (const { detect = {} } of this.all) {
      if (!detect.scope)
        continue;
      if ((_a = detect.fileExtensions) == null ? void 0 : _a.includes(extension))
        return getStartPath(detect.scope);
    }
    if (!fileHandle.name.endsWith(".json"))
      return null;
    const file = await fileHandle.getFile();
    let json;
    try {
      json = json5.parse(await file.text());
    } catch {
      return null;
    }
    for (const { type, detect } of this.all) {
      if (typeof type === "string" && type !== "json")
        continue;
      const { scope, fileContent } = detect != null ? detect : {};
      if (!scope || !fileContent)
        continue;
      return getStartPath(scope);
    }
    return null;
  }
  getId(filePath) {
    var _a, _b;
    return (_b = (_a = this.get(filePath)) == null ? void 0 : _a.id) != null ? _b : "unknown";
  }
  isJsonFile(filePath) {
    var _a, _b;
    const language = (_b = (_a = this.get(filePath)) == null ? void 0 : _a.meta) == null ? void 0 : _b.language;
    return language ? language === "json" : filePath.endsWith(".json");
  }
}
const defaultPackPaths = {
  behaviorPack: "./BP",
  resourcePack: "./RP",
  skinPack: "./SP",
  worldTemplate: "./WT"
};
class ProjectConfig {
  constructor(basePath) {
    this.basePath = basePath;
    this.data = {};
  }
  async refreshConfig() {
    try {
      this.data = await this.readConfig();
    } catch {
      this.data = {};
    }
  }
  async setup() {
    await this.refreshConfig();
  }
  get() {
    return this.data;
  }
  getPackRoot(packId) {
    var _a, _b;
    return (_b = (_a = this.data.packs) == null ? void 0 : _a[packId]) != null ? _b : defaultPackPaths[packId];
  }
  resolvePackPath(packId, filePath) {
    if (!filePath && !packId)
      return this.basePath;
    else if (!packId && filePath)
      return join(this.basePath, filePath);
    else if (!filePath && packId)
      return resolve(this.basePath, `${this.getPackRoot(packId)}`);
    return resolve(this.basePath, `${this.getPackRoot(packId)}/${filePath}`);
  }
  getAvailablePackPaths() {
    var _a;
    const paths = [];
    for (const packId of Object.keys((_a = this.data.packs) != null ? _a : {})) {
      paths.push(this.resolvePackPath(packId));
    }
    return paths;
  }
  getAvailablePacks() {
    var _a;
    const paths = {};
    for (const packId in (_a = this.data.packs) != null ? _a : {}) {
      paths[packId] = this.resolvePackPath(packId);
    }
    return paths;
  }
  async save() {
    await this.writeConfig(this.data);
  }
}
export { FileType, PackType, ProjectConfig, defaultPackPaths };

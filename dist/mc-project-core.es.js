import { join, extname } from "path-browserify";
import json5 from "json5";
import { hasAnyPath } from "bridge-common-utils";
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
    this.data = await this.readConfig();
  }
  async setup() {
    await this.refreshConfig();
  }
  get() {
    return this.data;
  }
  getRelativePackRoot(packId) {
    var _a, _b;
    return (_b = (_a = this.data.packs) == null ? void 0 : _a[packId]) != null ? _b : defaultPackPaths[packId];
  }
  getAbsolutePackRoot(packId) {
    return this.resolvePackPath(packId);
  }
  resolvePackPath(packId, filePath) {
    if (!filePath && !packId)
      return this.basePath;
    else if (!packId && filePath)
      return join(this.basePath, filePath);
    else if (!filePath && packId)
      return join(this.basePath, this.getRelativePackRoot(packId));
    return join(this.basePath, `${this.getRelativePackRoot(packId)}/${filePath}`);
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
class PackType {
  constructor(projectConfig) {
    this.projectConfig = projectConfig;
    this.packTypes = [];
    this.extensionPackTypes = new Set();
  }
  setProjectConfig(projectConfig) {
    this.projectConfig = projectConfig;
  }
  get all() {
    return this.packTypes.concat(...Array.from(this.extensionPackTypes.values()));
  }
  getFromId(packId) {
    return this.all.find((packType) => packType.id === packId);
  }
  get(filePath) {
    var _a, _b;
    const packTypes = (_b = (_a = this.projectConfig) == null ? void 0 : _a.getAvailablePacks()) != null ? _b : defaultPackPaths;
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
    this.extensionPackTypes.add(packType);
    return {
      dispose: () => this.extensionPackTypes.delete(packType)
    };
  }
}
class FileType {
  constructor(projectConfig, isMatch) {
    this.projectConfig = projectConfig;
    this.isMatch = isMatch;
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
  get(filePath, searchFileType, checkFileExtension = true) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
    const extension = filePath ? extname(filePath) : null;
    if (!extension)
      return;
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
      if (checkFileExtension && fileExtensions && !fileExtensions.includes(extension))
        continue;
      if (hasScope) {
        if (this.prefixMatchers(packTypes, scope).some((scope2) => filePath.startsWith(scope2)))
          return fileType;
      } else if (hasMatcher) {
        const mustMatchAny = this.prefixMatchers(packTypes, matcher.filter((m) => !m.startsWith("!")));
        const mustNotMatch = this.prefixMatchers(packTypes, matcher.filter((m) => m.startsWith("!")).map((m) => m.slice(1)));
        if (this.isMatch(filePath, mustMatchAny) && !this.isMatch(filePath, mustNotMatch)) {
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
    const getStartPath = (scope, packId) => {
      var _a2, _b;
      let startPath = Array.isArray(scope) ? scope[0] : scope;
      if (!startPath.endsWith("/"))
        startPath += "/";
      const packPath = (_b = (_a2 = this.projectConfig) == null ? void 0 : _a2.getAbsolutePackRoot(packId)) != null ? _b : "./unknown";
      return join(packPath, startPath);
    };
    const extension = `.${fileHandle.name.split(".").pop()}`;
    const validTypes = this.all.filter(({ detect }) => {
      var _a2;
      if (!detect || !detect.scope)
        return false;
      return (_a2 = detect.fileExtensions) == null ? void 0 : _a2.includes(extension);
    });
    const onlyOneExtensionMatch = validTypes.length === 1;
    const notAJsonFileButMatch = extension !== ".json" && validTypes.length > 0;
    if (onlyOneExtensionMatch || notAJsonFileButMatch) {
      const { detect } = validTypes[0];
      return getStartPath(detect.scope, Array.isArray(detect.packType) ? detect.packType[0] : (_a = detect.packType) != null ? _a : "behaviorPack");
    }
    if (extension !== ".json")
      return null;
    const file = await fileHandle.getFile();
    let json;
    try {
      json = json5.parse(await file.text());
    } catch {
      return null;
    }
    for (const { type, detect } of validTypes) {
      if (typeof type === "string" && type !== "json")
        continue;
      const {
        scope,
        fileContent,
        packType = "behaviorPack"
      } = detect != null ? detect : {};
      if (!scope || !fileContent)
        continue;
      if (!hasAnyPath(json, fileContent))
        continue;
      return getStartPath(scope, Array.isArray(packType) ? packType[0] : packType);
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
export { FileType, PackType, ProjectConfig, defaultPackPaths };

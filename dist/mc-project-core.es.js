import { isMatch } from "micromatch";
import { parse } from "json5";
class PackType {
  constructor(projectConfig) {
    this.projectConfig = projectConfig;
  }
}
function assertPath(path) {
  if (typeof path !== "string") {
    throw new TypeError("Path must be a string. Received " + JSON.stringify(path));
  }
}
function normalizeStringPosix(path, allowAboveRoot) {
  var res = "";
  var lastSegmentLength = 0;
  var lastSlash = -1;
  var dots = 0;
  var code;
  for (var i = 0; i <= path.length; ++i) {
    if (i < path.length)
      code = path.charCodeAt(i);
    else if (code === 47)
      break;
    else
      code = 47;
    if (code === 47) {
      if (lastSlash === i - 1 || dots === 1)
        ;
      else if (lastSlash !== i - 1 && dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
          if (res.length > 2) {
            var lastSlashIndex = res.lastIndexOf("/");
            if (lastSlashIndex !== res.length - 1) {
              if (lastSlashIndex === -1) {
                res = "";
                lastSegmentLength = 0;
              } else {
                res = res.slice(0, lastSlashIndex);
                lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
              }
              lastSlash = i;
              dots = 0;
              continue;
            }
          } else if (res.length === 2 || res.length === 1) {
            res = "";
            lastSegmentLength = 0;
            lastSlash = i;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0)
            res += "/..";
          else
            res = "..";
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0)
          res += "/" + path.slice(lastSlash + 1, i);
        else
          res = path.slice(lastSlash + 1, i);
        lastSegmentLength = i - lastSlash - 1;
      }
      lastSlash = i;
      dots = 0;
    } else if (code === 46 && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}
function _format(sep, pathObject) {
  var dir = pathObject.dir || pathObject.root;
  var base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
  if (!dir) {
    return base;
  }
  if (dir === pathObject.root) {
    return dir + base;
  }
  return dir + sep + base;
}
var posix = {
  resolve: function resolve() {
    var resolvedPath = "";
    var resolvedAbsolute = false;
    var cwd;
    for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path;
      if (i >= 0)
        path = arguments[i];
      else {
        if (cwd === void 0)
          cwd = process.cwd();
        path = cwd;
      }
      assertPath(path);
      if (path.length === 0) {
        continue;
      }
      resolvedPath = path + "/" + resolvedPath;
      resolvedAbsolute = path.charCodeAt(0) === 47;
    }
    resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);
    if (resolvedAbsolute) {
      if (resolvedPath.length > 0)
        return "/" + resolvedPath;
      else
        return "/";
    } else if (resolvedPath.length > 0) {
      return resolvedPath;
    } else {
      return ".";
    }
  },
  normalize: function normalize(path) {
    assertPath(path);
    if (path.length === 0)
      return ".";
    var isAbsolute2 = path.charCodeAt(0) === 47;
    var trailingSeparator = path.charCodeAt(path.length - 1) === 47;
    path = normalizeStringPosix(path, !isAbsolute2);
    if (path.length === 0 && !isAbsolute2)
      path = ".";
    if (path.length > 0 && trailingSeparator)
      path += "/";
    if (isAbsolute2)
      return "/" + path;
    return path;
  },
  isAbsolute: function isAbsolute(path) {
    assertPath(path);
    return path.length > 0 && path.charCodeAt(0) === 47;
  },
  join: function join() {
    if (arguments.length === 0)
      return ".";
    var joined;
    for (var i = 0; i < arguments.length; ++i) {
      var arg = arguments[i];
      assertPath(arg);
      if (arg.length > 0) {
        if (joined === void 0)
          joined = arg;
        else
          joined += "/" + arg;
      }
    }
    if (joined === void 0)
      return ".";
    return posix.normalize(joined);
  },
  relative: function relative(from, to) {
    assertPath(from);
    assertPath(to);
    if (from === to)
      return "";
    from = posix.resolve(from);
    to = posix.resolve(to);
    if (from === to)
      return "";
    var fromStart = 1;
    for (; fromStart < from.length; ++fromStart) {
      if (from.charCodeAt(fromStart) !== 47)
        break;
    }
    var fromEnd = from.length;
    var fromLen = fromEnd - fromStart;
    var toStart = 1;
    for (; toStart < to.length; ++toStart) {
      if (to.charCodeAt(toStart) !== 47)
        break;
    }
    var toEnd = to.length;
    var toLen = toEnd - toStart;
    var length = fromLen < toLen ? fromLen : toLen;
    var lastCommonSep = -1;
    var i = 0;
    for (; i <= length; ++i) {
      if (i === length) {
        if (toLen > length) {
          if (to.charCodeAt(toStart + i) === 47) {
            return to.slice(toStart + i + 1);
          } else if (i === 0) {
            return to.slice(toStart + i);
          }
        } else if (fromLen > length) {
          if (from.charCodeAt(fromStart + i) === 47) {
            lastCommonSep = i;
          } else if (i === 0) {
            lastCommonSep = 0;
          }
        }
        break;
      }
      var fromCode = from.charCodeAt(fromStart + i);
      var toCode = to.charCodeAt(toStart + i);
      if (fromCode !== toCode)
        break;
      else if (fromCode === 47)
        lastCommonSep = i;
    }
    var out = "";
    for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
      if (i === fromEnd || from.charCodeAt(i) === 47) {
        if (out.length === 0)
          out += "..";
        else
          out += "/..";
      }
    }
    if (out.length > 0)
      return out + to.slice(toStart + lastCommonSep);
    else {
      toStart += lastCommonSep;
      if (to.charCodeAt(toStart) === 47)
        ++toStart;
      return to.slice(toStart);
    }
  },
  _makeLong: function _makeLong(path) {
    return path;
  },
  dirname: function dirname(path) {
    assertPath(path);
    if (path.length === 0)
      return ".";
    var code = path.charCodeAt(0);
    var hasRoot = code === 47;
    var end = -1;
    var matchedSlash = true;
    for (var i = path.length - 1; i >= 1; --i) {
      code = path.charCodeAt(i);
      if (code === 47) {
        if (!matchedSlash) {
          end = i;
          break;
        }
      } else {
        matchedSlash = false;
      }
    }
    if (end === -1)
      return hasRoot ? "/" : ".";
    if (hasRoot && end === 1)
      return "//";
    return path.slice(0, end);
  },
  basename: function basename(path, ext) {
    if (ext !== void 0 && typeof ext !== "string")
      throw new TypeError('"ext" argument must be a string');
    assertPath(path);
    var start = 0;
    var end = -1;
    var matchedSlash = true;
    var i;
    if (ext !== void 0 && ext.length > 0 && ext.length <= path.length) {
      if (ext.length === path.length && ext === path)
        return "";
      var extIdx = ext.length - 1;
      var firstNonSlashEnd = -1;
      for (i = path.length - 1; i >= 0; --i) {
        var code = path.charCodeAt(i);
        if (code === 47) {
          if (!matchedSlash) {
            start = i + 1;
            break;
          }
        } else {
          if (firstNonSlashEnd === -1) {
            matchedSlash = false;
            firstNonSlashEnd = i + 1;
          }
          if (extIdx >= 0) {
            if (code === ext.charCodeAt(extIdx)) {
              if (--extIdx === -1) {
                end = i;
              }
            } else {
              extIdx = -1;
              end = firstNonSlashEnd;
            }
          }
        }
      }
      if (start === end)
        end = firstNonSlashEnd;
      else if (end === -1)
        end = path.length;
      return path.slice(start, end);
    } else {
      for (i = path.length - 1; i >= 0; --i) {
        if (path.charCodeAt(i) === 47) {
          if (!matchedSlash) {
            start = i + 1;
            break;
          }
        } else if (end === -1) {
          matchedSlash = false;
          end = i + 1;
        }
      }
      if (end === -1)
        return "";
      return path.slice(start, end);
    }
  },
  extname: function extname(path) {
    assertPath(path);
    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    var preDotState = 0;
    for (var i = path.length - 1; i >= 0; --i) {
      var code = path.charCodeAt(i);
      if (code === 47) {
        if (!matchedSlash) {
          startPart = i + 1;
          break;
        }
        continue;
      }
      if (end === -1) {
        matchedSlash = false;
        end = i + 1;
      }
      if (code === 46) {
        if (startDot === -1)
          startDot = i;
        else if (preDotState !== 1)
          preDotState = 1;
      } else if (startDot !== -1) {
        preDotState = -1;
      }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      return "";
    }
    return path.slice(startDot, end);
  },
  format: function format(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
      throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof pathObject);
    }
    return _format("/", pathObject);
  },
  parse: function parse2(path) {
    assertPath(path);
    var ret = { root: "", dir: "", base: "", ext: "", name: "" };
    if (path.length === 0)
      return ret;
    var code = path.charCodeAt(0);
    var isAbsolute2 = code === 47;
    var start;
    if (isAbsolute2) {
      ret.root = "/";
      start = 1;
    } else {
      start = 0;
    }
    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    var i = path.length - 1;
    var preDotState = 0;
    for (; i >= start; --i) {
      code = path.charCodeAt(i);
      if (code === 47) {
        if (!matchedSlash) {
          startPart = i + 1;
          break;
        }
        continue;
      }
      if (end === -1) {
        matchedSlash = false;
        end = i + 1;
      }
      if (code === 46) {
        if (startDot === -1)
          startDot = i;
        else if (preDotState !== 1)
          preDotState = 1;
      } else if (startDot !== -1) {
        preDotState = -1;
      }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      if (end !== -1) {
        if (startPart === 0 && isAbsolute2)
          ret.base = ret.name = path.slice(1, end);
        else
          ret.base = ret.name = path.slice(startPart, end);
      }
    } else {
      if (startPart === 0 && isAbsolute2) {
        ret.name = path.slice(1, startDot);
        ret.base = path.slice(1, end);
      } else {
        ret.name = path.slice(startPart, startDot);
        ret.base = path.slice(startPart, end);
      }
      ret.ext = path.slice(startDot, end);
    }
    if (startPart > 0)
      ret.dir = path.slice(0, startPart - 1);
    else if (isAbsolute2)
      ret.dir = "/";
    return ret;
  },
  sep: "/",
  delimiter: ":",
  win32: null,
  posix: null
};
posix.posix = posix;
var pathBrowserify = posix;
class FileType {
  constructor(projectConfig) {
    this.projectConfig = projectConfig;
    this.pluginFileTypes = new Set();
    this.fileTypes = [];
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
    const extension = filePath ? pathBrowserify.extname(filePath) : null;
    for (const fileType of this.fileTypes) {
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
    for (const fileType of this.fileTypes) {
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
    for (const { detect = {} } of this.fileTypes) {
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
      json = parse(await file.text());
    } catch {
      return null;
    }
    for (const { type, detect } of this.fileTypes) {
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
  getMonacoSchemaEntries() {
    return this.fileTypes.map(({ detect = {}, schema }) => {
      if (!detect.matcher)
        return null;
      const packTypes = (detect == null ? void 0 : detect.packType) === void 0 ? [] : Array.isArray(detect == null ? void 0 : detect.packType) ? detect == null ? void 0 : detect.packType : [detect == null ? void 0 : detect.packType];
      return {
        fileMatch: this.prefixMatchers(packTypes, Array.isArray(detect.matcher) ? [...detect.matcher] : [detect.matcher]),
        uri: schema
      };
    }).filter((schemaEntry) => schemaEntry !== null).flat();
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
      return pathBrowserify.join(this.basePath, filePath);
    else if (!filePath && packId)
      return pathBrowserify.resolve(this.basePath, `${this.getPackRoot(packId)}`);
    return pathBrowserify.resolve(this.basePath, `${this.getPackRoot(packId)}/${filePath}`);
  }
  getAvailablePackPaths() {
    var _a;
    const paths = [];
    for (const packId of Object.keys((_a = this.data.packs) != null ? _a : {})) {
      paths.push(this.resolvePackPath(packId));
    }
    return paths;
  }
  async save() {
    await this.writeConfig(this.data);
  }
}
export { FileType, PackType, ProjectConfig };

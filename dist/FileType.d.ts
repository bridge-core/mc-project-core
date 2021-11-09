import type { ProjectConfig } from './ProjectConfig';
import type { TPackTypeId } from './PackType';
declare type TCompareOperator = '>' | '>=' | '=' | '<' | '<=';
export interface IFileType {
    type?: 'json' | 'text' | 'nbt';
    id: string;
    icon?: string;
    detect?: {
        packType?: TPackTypeId | TPackTypeId[];
        scope?: string | string[];
        matcher?: string | string[];
        fileContent?: string[];
        fileExtensions?: string[];
    };
    schema: string;
    types: (string | [string, {
        targetVersion: [TCompareOperator, string];
    }])[];
    packSpider: string;
    lightningCache: string;
    definitions: IDefinitions;
    formatOnSaveCapable: boolean;
    documentation?: {
        baseUrl: string;
        supportsQuerying?: boolean;
    };
    meta?: {
        commandsUseSlash?: boolean;
        language?: string;
    };
    highlighterConfiguration?: {
        keywords?: string[];
        typeIdentifiers?: string[];
        variables?: string[];
        definitions?: string[];
    };
}
export interface IDefinitions {
    [key: string]: IDefinition | IDefinition[];
}
export interface IDefinition {
    directReference?: boolean;
    from: string;
    match: string;
}
export interface IMonacoSchemaArrayEntry {
    fileMatch?: string[];
    uri: string;
    schema?: any;
}
export declare abstract class FileType<TSetupArg> {
    protected projectConfig?: ProjectConfig | undefined;
    protected pluginFileTypes: Set<IFileType>;
    protected fileTypes: IFileType[];
    constructor(projectConfig?: ProjectConfig | undefined);
    setProjectConfig(projectConfig: ProjectConfig): void;
    abstract setup(arg: TSetupArg): Promise<void>;
    addPluginFileType(fileDef: IFileType): {
        dispose: () => boolean;
    };
    getPluginFileTypes(): IFileType[];
    setPluginFileTypes(fileDefs?: IFileType[]): void;
    get(filePath?: string, searchFileType?: string): IFileType | undefined;
    protected prefixMatchers(packTypes: TPackTypeId[], matchers: string[]): string[];
    getIds(): string[];
    guessFolder(fileHandle: {
        name: string;
        getFile: () => Promise<File>;
    }): Promise<string | null>;
    getId(filePath: string): string;
    isJsonFile(filePath: string): boolean;
    getMonacoSchemaEntries(): IMonacoSchemaArrayEntry[];
}
export {};

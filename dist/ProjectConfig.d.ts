import type { TPackTypeId } from './PackType';
export interface IConfigJson {
    type: 'minecraftBedrock' | 'minecraftJava';
    name: string;
    author: string;
    authors: (string | AuthorData)[];
    targetVersion: string;
    experimentalGameplay?: Record<string, boolean>;
    capabilities: string[];
    namespace: string;
    packs: {
        [packId in TPackTypeId]?: string;
    };
    worlds: string[];
    packDefinitions: {
        families: IPackDefinition;
        tags: IPackDefinition;
        scoreboardObjectives: IPackDefinition;
        names: IPackDefinition;
    };
    [uniqueToolId: string]: any;
    bridge?: {
        lightTheme?: string;
        darkTheme?: string;
        v1CompatMode?: boolean;
    };
    compiler?: {
        plugins: (string | [string, any])[];
    };
}
interface AuthorData {
    name: string;
    logo?: string;
}
interface IPackDefinition {
    type?: string;
    exclude: string[];
    include: string[];
}
export declare const defaultPackPaths: {
    readonly behaviorPack: "./BP";
    readonly resourcePack: "./RP";
    readonly skinPack: "./SP";
    readonly worldTemplate: "./WT";
};
export declare abstract class ProjectConfig {
    protected basePath: string;
    protected data: Partial<IConfigJson>;
    constructor(basePath: string);
    protected abstract readConfig(): Promise<IConfigJson>;
    protected abstract writeConfig(config: Partial<IConfigJson>): Promise<void>;
    refreshConfig(): Promise<void>;
    setup(): Promise<void>;
    get(): Partial<IConfigJson>;
    getPackRoot(packId: TPackTypeId): string;
    resolvePackPath(packId?: TPackTypeId, filePath?: string): string;
    getAvailablePackPaths(): string[];
    getAvailablePacks(): Record<string, string>;
    save(): Promise<void>;
}
export {};

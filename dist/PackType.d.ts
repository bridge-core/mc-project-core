import { ProjectConfig } from './ProjectConfig';
export interface IPackType {
    id: TPackTypeId;
    matcher: string | string[];
    color: string;
    icon: string;
}
export declare type TPackTypeId = 'behaviorPack' | 'resourcePack' | 'skinPack' | 'worldTemplate';
export declare abstract class PackType<TSetupArg> {
    protected projectConfig: ProjectConfig | undefined;
    protected packTypes: IPackType[];
    protected extensionPackTypes: Set<IPackType>;
    constructor(projectConfig: ProjectConfig | undefined);
    setProjectConfig(projectConfig: ProjectConfig): void;
    abstract setup(arg: TSetupArg): Promise<void>;
    get all(): IPackType[];
    getFromId(packId: TPackTypeId): IPackType | undefined;
    get(filePath: string): IPackType | undefined;
    getId(filePath: string): "unknown" | TPackTypeId;
    addExtensionPackType(packType: IPackType): {
        dispose: () => boolean;
    };
}

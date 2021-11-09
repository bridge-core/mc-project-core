import type { ProjectConfig } from './ProjectConfig'
import { v4 as uuid } from 'uuid'
/**
 * Describes the structure of a pack definition
 */
export interface IPackType {
	id: TPackTypeId
	matcher: string | string[]
	color: string
	icon: string
}

export type TPackTypeId =
	| 'behaviorPack'
	| 'resourcePack'
	| 'skinPack'
	| 'worldTemplate'

export abstract class PackType<TSetupArg> {
	protected packTypes: IPackType[] = []
	protected extensionPackTypes = new Map<string, IPackType>()

	constructor(protected projectConfig: ProjectConfig) {}

	abstract setup(arg: TSetupArg): Promise<void>

	get all() {
		return [...this.packTypes].concat(
			...Array.from(this.extensionPackTypes.values())
		)
	}

	getFromId(packId: TPackTypeId) {
		return this.all.find((packType) => packType.id === packId)
	}
	get(filePath: string) {
		const packTypes = this.projectConfig.getAvailablePacks()

		for (const packId in packTypes) {
			if (filePath.startsWith(packTypes[packId])) {
				return this.getFromId(packId as TPackTypeId)
			}
		}
	}
	getId(filePath: string) {
		return this.get(filePath)?.id ?? 'unknown'
	}

	addExtensionPackType(packType: IPackType) {
		const id = uuid()
		this.extensionPackTypes.set(id, packType)

		return {
			dispose: () => this.extensionPackTypes.delete(id),
		}
	}
}

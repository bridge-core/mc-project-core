import type { TPackTypeId } from './PackType'
import { resolve, join } from 'path-browserify'

export interface IConfigJson {
	/**
	 * Defines the type of a project
	 */
	type: 'minecraftBedrock' | 'minecraftJava'

	/**
	 * The name of the project
	 */
	name: string

	/**
	 * Creator of the project
	 *
	 * @deprecated
	 * @example "solvedDev"
	 */
	author: string

	/**
	 * Creators of the project
	 *
	 * @example ["solvedDev", "Joel ant 05"]
	 */
	authors: (string | AuthorData)[]

	/**
	 * The Minecraft version this project targets
	 *
	 * @example "1.17.0" / "1.16.220"
	 */
	targetVersion: string

	/**
	 * Experimental gameplay the project intends to use.
	 *
	 * @example { "cavesAndCliffs": true, "holidayCreatorFeatures": false }
	 */
	experimentalGameplay?: Record<string, boolean>

	/**
	 * Additional capabilities the project wants to use
	 *
	 * @deprecated
	 * @example ["scriptingAPI", "gameTestAPI"]
	 */
	capabilities: string[]

	/**
	 * The namespace used for the project. The namespace "minecraft" is not a valid string for this field.
	 *
	 * @example "my_project"
	 */
	namespace: string

	/**
	 * Maps the id of packs this project contains to a path relative to the config.json
	 *
	 * @example { "behaviorPack": "./BP", "resourcePack": "./RP" }
	 */
	packs: {
		[packId in TPackTypeId]?: string
	}

	/**
	 * Defines a list of glob patterns pointing to folders storing Minecraft worlds.
	 * Glob patterns may not end with "**" to avoid ambiguity. If implementors encounter such an invalid glob pattern upon parsing,
	 * a warning should be raised and the glob pattern should be ignored.
	 *
	 * @example ["./worlds/1", "./worlds/other/*"]
	 * @example ["./worlds/*"]
	 */
	worlds: string[]

	/**
	 * Allows users to define additional data which is hard to find for tools
	 * (e.g. scoreboards setup inside of a world)
	 *
	 * @example { "names": { "include": ["solvedDev"] } }
	 */
	packDefinitions: {
		families: IPackDefinition
		tags: IPackDefinition
		scoreboardObjectives: IPackDefinition
		names: IPackDefinition
	}

	/**
	 * States whether the project is developed for use on Bedrock Dedicated Server software
	 * Certain GameTest modules are dedicated server only (e.g. 'mojang-minecraft-server-admin')
	 */
	bdsProject: boolean

	/**
	 * Tools can create their own namespace inside of this file to save tool specific data and settings
	 *
	 * @example { "bridge": { "darkTheme": "bridge.default.dark", "lightTheme": "bridge.default.light" } }
	 */
	[uniqueToolId: string]: any

	bridge?: {
		formatVersion?: number
		lightTheme?: string
		darkTheme?: string
		v1CompatMode?: boolean

		[k: string]: unknown
	}

	compiler?: {
		plugins: (string | [string, any])[]
	}
}

interface AuthorData {
	/**
	 * Name of the author
	 *
	 * @example "solvedDev"
	 */
	name: string
	/**
	 * Path to an image (relative to the project root) that serves as an icon for this author.
	 * Tools should support ".png" & ".jpg" images
	 *
	 * @example "./meta/icons/solvedDev.png"
	 */
	logo?: string
}

interface IPackDefinition {
	/**
	 * Optional: Define e.g. the type of a scoreboard objective
	 *
	 * @example "dummy"
	 */
	type?: string
	/**
	 * Strings to exclude from a tool's collected data
	 */
	exclude: string[]
	/**
	 * String to add to a tool's collected data
	 */
	include: string[]
}

export const defaultPackPaths = <const>{
	behaviorPack: './BP',
	resourcePack: './RP',
	skinPack: './SP',
	worldTemplate: './WT',
}

export abstract class ProjectConfig {
	protected data: Partial<IConfigJson> = {}

	constructor(protected basePath: string) {}

	protected abstract readConfig(): Promise<IConfigJson>
	protected abstract writeConfig(config: Partial<IConfigJson>): Promise<void>

	async refreshConfig() {
		// Update this.data from config on disk
		this.data = await this.readConfig()
	}

	async setup() {
		await this.refreshConfig()
	}

	get() {
		return this.data
	}

	/**
	 * TODO: These functions should be a part of PackType.ts. They don't really make sense here
	 */
	/**
	 * Get the relative path to the specified pack
	 * @param packId
	 * @returns Path relative to the project config file
	 */
	getRelativePackRoot(packId: TPackTypeId) {
		return this.data.packs?.[packId] ?? defaultPackPaths[packId]
	}
	/**
	 * Get the absolute path to the specified pack
	 * @param packId
	 * @returns Path relative to the bridge folder
	 */
	getAbsolutePackRoot(packId: TPackTypeId) {
		return this.resolvePackPath(packId)
	}
	resolvePackPath(packId?: TPackTypeId, filePath?: string) {
		if (!filePath && !packId) return this.basePath
		else if (!packId && filePath) return join(this.basePath, filePath)
		else if (!filePath && packId)
			return resolve(this.basePath, this.getRelativePackRoot(packId))

		return resolve(
			this.basePath,
			`${this.getRelativePackRoot(packId!)}/${filePath}`
		)
	}
	getAvailablePackPaths() {
		const paths: string[] = []

		for (const packId of Object.keys(this.data.packs ?? {})) {
			paths.push(this.resolvePackPath(<TPackTypeId>packId))
		}

		return paths
	}
	getAvailablePacks() {
		const paths: Record<string, string> = {}

		for (const packId in this.data.packs ?? {}) {
			paths[packId] = this.resolvePackPath(<TPackTypeId>packId)
		}

		return paths
	}

	async save() {
		await this.writeConfig(this.data)
	}
}

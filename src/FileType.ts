import type { ProjectConfig } from './ProjectConfig'
import type { TPackTypeId } from './PackType'
import { extname, join } from 'path-browserify'
import json5 from 'json5'
import { hasAnyPath } from 'bridge-common-utils'

type TCompareOperator = '>' | '>=' | '=' | '<' | '<='

/**
 * Describes the structure of a file definition
 */
export interface IFileType {
	type?: 'json' | 'text' | 'nbt'
	id: string
	icon?: string
	detect?: {
		packType?: TPackTypeId | TPackTypeId[]
		scope?: string | string[]
		matcher?: string | string[]
		fileContent?: string[]
		fileExtensions?: string[]
	}

	schema: string
	types: (string | [string, { targetVersion: [TCompareOperator, string] }])[]
	packSpider: string
	lightningCache: string
	definitions: IDefinitions
	formatOnSaveCapable: boolean
	documentation?: {
		baseUrl: string
		supportsQuerying?: boolean // Default: true
	}
	meta?: {
		commandsUseSlash?: boolean
		language?: string
	}
	highlighterConfiguration?: {
		keywords?: string[]
		typeIdentifiers?: string[]
		variables?: string[]
		definitions?: string[]
	}
}
export interface IDefinitions {
	[key: string]: IDefinition | IDefinition[]
}
export interface IDefinition {
	directReference?: boolean
	from: string
	match: string
}

/**
 * Used for return type of FileType.getMonacoSchemaArray() function
 */
export interface IMonacoSchemaArrayEntry {
	fileMatch?: string[]
	uri: string
	schema?: any
}

/**
 * Utilities around bridge.'s file definitions
 */
export abstract class FileType<TSetupArg> {
	protected pluginFileTypes = new Set<IFileType>()
	protected fileTypes: IFileType[] = []

	/**
	 *
	 * @param projectConfig
	 * @param isMatch Should return true if the specified string matches the given glob pattern.
	 */
	constructor(
		protected projectConfig: ProjectConfig | undefined,
		protected isMatch: (str: string, pattern: string | string[]) => boolean
	) {}

	get all() {
		return this.fileTypes.concat([...this.pluginFileTypes.values()])
	}

	setProjectConfig(projectConfig: ProjectConfig) {
		this.projectConfig = projectConfig
	}

	abstract setup(arg: TSetupArg): Promise<void>

	addPluginFileType(fileDef: IFileType) {
		this.pluginFileTypes.add(fileDef)

		return {
			dispose: () => this.pluginFileTypes.delete(fileDef),
		}
	}
	getPluginFileTypes() {
		return [...this.pluginFileTypes.values()]
	}
	setPluginFileTypes(fileDefs: IFileType[] = []) {
		this.pluginFileTypes.clear()
		fileDefs.forEach((fileDef) => this.pluginFileTypes.add(fileDef))
	}

	/**
	 * Get the file definition data for the given file path
	 * @param filePath file path to fetch file definition for
	 */
	get(filePath?: string, searchFileType?: string) {
		const extension = filePath ? extname(filePath) : null

		for (const fileType of this.all) {
			if (searchFileType !== undefined && searchFileType === fileType.id)
				return fileType
			else if (!filePath) continue

			const packTypes =
				fileType.detect?.packType === undefined
					? []
					: Array.isArray(fileType.detect?.packType)
					? fileType.detect?.packType
					: [fileType.detect?.packType]

			const fileExtensions = fileType.detect?.fileExtensions
			const hasScope = !!fileType.detect?.scope
			const scope = Array.isArray(fileType.detect?.scope)
				? fileType.detect?.scope
				: [fileType.detect?.scope!]
			const hasMatcher = !!fileType.detect?.matcher
			const matcher = Array.isArray(fileType.detect?.matcher)
				? fileType.detect?.matcher
				: [fileType.detect?.matcher!]

			if (
				fileExtensions &&
				extension &&
				!fileExtensions.includes(extension)
			)
				continue

			if (hasScope) {
				if (
					this.prefixMatchers(packTypes, scope!).some((scope) =>
						filePath.startsWith(scope)
					)
				)
					return fileType
			} else if (hasMatcher) {
				if (
					this.isMatch(
						filePath,
						this.prefixMatchers(packTypes, matcher!)
					)
				) {
					return fileType
				}
			} else {
				console.log(fileType)
				throw new Error(
					`Invalid file definition, no "detect" properties`
				)
			}
		}
	}
	protected prefixMatchers(packTypes: TPackTypeId[], matchers: string[]) {
		if (!this.projectConfig) return []

		if (packTypes.length === 0)
			return matchers.map((matcher) =>
				this.projectConfig!.resolvePackPath(undefined, matcher)
			)

		const prefixed: string[] = []

		for (const packType of packTypes) {
			for (const matcher of matchers) {
				prefixed.push(
					this.projectConfig!.resolvePackPath(packType, matcher)
				)
			}
		}

		return prefixed
	}

	getIds() {
		const ids = []

		for (const fileType of this.all) {
			ids.push(fileType.id)
		}

		return ids
	}

	/**
	 * Guess the file path of a file given a file handle
	 */
	async guessFolder(fileHandle: {
		name: string
		getFile: () => Promise<File>
	}) {
		// Helper function
		const getStartPath = (
			scope: string | string[],
			packId: TPackTypeId
		) => {
			let startPath = Array.isArray(scope) ? scope[0] : scope
			if (!startPath.endsWith('/')) startPath += '/'

			const packPath =
				this.projectConfig?.getPackRoot(packId) ?? './unknown'

			return join(packPath, startPath)
		}

		// 1. Guess based on file extension
		const extension = `.${fileHandle.name.split('.').pop()!}`
		for (const { detect = {} } of this.all) {
			if (!detect.scope) continue
			if (detect.fileExtensions?.includes(extension))
				return getStartPath(
					detect.scope,
					Array.isArray(detect.packType)
						? detect.packType[0]
						: detect.packType ?? 'behaviorPack'
				)
		}

		if (!fileHandle.name.endsWith('.json')) return null

		// 2. Guess based on json file content
		const file = await fileHandle.getFile()
		let json: any
		try {
			json = json5.parse(await file.text())
		} catch {
			return null
		}

		for (const { type, detect } of this.all) {
			if (typeof type === 'string' && type !== 'json') continue

			const {
				scope,
				fileContent,
				packType = 'behaviorPack',
			} = detect ?? {}
			if (!scope || !fileContent) continue

			if (!hasAnyPath(json, fileContent)) continue

			return getStartPath(
				scope,
				Array.isArray(packType) ? packType[0] : packType
			)
		}

		return null
	}

	/**
	 * Get the file type/file definition id for the provided file path
	 * @param filePath file path to get the file type of
	 */
	getId(filePath: string) {
		return this.get(filePath)?.id ?? 'unknown'
	}

	/**
	 * A function that tests whether a file path is a JSON file respecting the meta.language property & file extension
	 * @returns Whether a file is considered a "JSON" file
	 */
	isJsonFile(filePath: string) {
		const language = this.get(filePath)?.meta?.language
		return language ? language === 'json' : filePath.endsWith('.json')
	}
}

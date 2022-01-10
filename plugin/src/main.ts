import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
} from 'obsidian'

import Airtable from 'airtable'
import {
	create,
	destroy,
	read,
	readBySlug,
	update,
	updateBySlug,
} from './utils/airtableHelpers'
import { createSettings } from './settings'
import {
	CREATED_NOTE,
	CREATING_ERROR,
	DELETED_NOTE,
	DELETING_ERROR,
	NOTE_FOUND,
	NOTE_NOT_FOUND,
	NOTE_UPDATED,
	SETTINGS_NOT_SET,
	UPDATING_ERROR,
} from './txt'
import { slugify } from './utils/slugify'
import { ListNotesModal } from './listNotesModal'
interface ShareLinkPluginSettings {
	airtableAPIKey: string
	airtableBase: string
	websiteUrl: string
	airtableView: string
}
const DEFAULT_SETTINGS: ShareLinkPluginSettings = {
	airtableAPIKey: '',
	airtableBase: '',
	airtableView: '',
	websiteUrl: '',
}

class SettingTab extends PluginSettingTab {
	plugin: PublishNotesPlugin

	constructor(app: App, plugin: PublishNotesPlugin) {
		super(app, plugin)
		this.plugin = plugin
	}

	display(): void {
		this.containerEl.empty()

		createSettings(this)
	}
}

export default class PublishNotesPlugin extends Plugin {
	settings: ShareLinkPluginSettings
	base: any

	loadAirtable() {
		const {
			airtableAPIKey: apiKey,
			airtableBase: baseID,
			airtableView: tableName,
		} = this.settings
		if (baseID && apiKey && tableName) {
			Airtable.configure({
				apiKey,
			})
			this.base = Airtable.base(baseID)
		}
	}
	async onload() {
		await this.loadSettings()

		this.addCommand({
			id: 'list-notes',
			name: 'List published notes',
			callback: () => {
				new ListNotesModal(this.app, this).open()
			},
		})

		this.addCommand({
			id: 'publish-note',
			name: 'Publish Note',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				if (!this.isAirtableInitialized()) {
					new Notice(SETTINGS_NOT_SET)
					return
				}

				const { airtableView, websiteUrl } = this.settings
				const contents = editor.getValue()
				const { path, basename } = view.file
				const slug = slugify(path)
				try {
					const notes = await read({
						base: this.base,
						view: airtableView,
						opts: {
							maxRecords: 1,
							filterByFormula: `{slug} = '${slug}'`,
						},
					})

					if (!notes.length) {
						await this.createAirtableRecord(
							contents,
							path,
							basename
						)
						return
					}
					new Notice(NOTE_FOUND)
					const id = notes[0].id
					const [updatedRecord] = await update({
						base: this.base,
						view: airtableView,
						id,
						record: {
							slug,
							data: contents,
							title: basename,
						},
					})
					const link = `${websiteUrl}/notes/${slugify(
						updatedRecord.fields.slug
					)}`
					navigator.clipboard.writeText(link)
					new Notice(NOTE_UPDATED)
				} catch (e) {
					console.log(e)
					new Notice(CREATING_ERROR)
					return
				}
			},
		})

		this.addCommand({
			id: 'update-note',
			name: 'Update Note',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				if (!this.isAirtableInitialized()) {
					new Notice(SETTINGS_NOT_SET)
					return
				}

				const { path, basename } = view.file
				const slug = slugify(path)
				try {
					const updatedRecord = await updateBySlug({
						view: this.settings.airtableView,
						base: this.base,
						slug,
						record: {
							data: editor.getValue(),
							slug,
							title: basename,
						},
					})
					const link = `${this.settings.websiteUrl}/notes/${slugify(
						updatedRecord.slug
					)}`
					navigator.clipboard.writeText(link)
					new Notice(NOTE_UPDATED)
				} catch (e) {
					console.log(e)
				}
			},
		})
		this.addCommand({
			id: 'delete-note',
			name: 'Delete Note',
			editorCallback: async (_, view: MarkdownView) => {
				if (!this.isAirtableInitialized()) {
					new Notice(SETTINGS_NOT_SET)
					return
				}

				const { path } = view.file
				const slug = slugify(path)
				const { airtableView } = this.settings
				try {
					const note = await readBySlug({
						base: this.base,
						view: airtableView,
						slug,
					})

					if (!note) {
						new Notice(NOTE_NOT_FOUND)
						return
					}
					await destroy({
						base: this.base,
						view: airtableView,
						id: note.id,
					})
					new Notice(DELETED_NOTE)
				} catch (e) {
					console.log(e)
					new Notice(DELETING_ERROR)
					return
				}
			},
		})

		this.addSettingTab(new SettingTab(this.app, this))
	}

	onunload() { }

	async createAirtableRecord(contents: string, path: string, title: string) {
		const { websiteUrl, airtableView } = this.settings
		new Notice('Creating your note')
		try {
			const [createdRecord] = await create({
				view: airtableView,
				base: this.base,
				record: {
					slug: slugify(path),
					data: contents,
					title: title,
				},
			})

			const link = `${websiteUrl}/notes/${slugify(
				createdRecord.fields.slug
			)}`
			navigator.clipboard.writeText(link)
			new Notice(CREATED_NOTE)
		} catch (e) {
			console.log(e)
			new Notice(CREATING_ERROR)
			return
		}
	}

	isAirtableInitialized() {
		const { airtableAPIKey, airtableBase, airtableView } = this.settings
		if (!airtableAPIKey || !airtableBase || !airtableView) return false

		return true
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		)
		this.loadAirtable()
	}

	async saveSettings() {
		await this.saveData(this.settings)
		this.loadAirtable()
	}
}

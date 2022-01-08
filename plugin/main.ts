import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from 'obsidian'

import Airtable from 'airtable'
import { create, read, update } from './airtableHelpers'

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

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin)
		this.plugin = plugin
	}

	display(): void {
		const { containerEl } = this

		containerEl.empty()

		new Setting(containerEl)
			.setName('Airtable API Key')
			.setDesc(
				'This is not shared and it will stay local to your computer.'
			)
			.addText((text) =>
				text
					.setPlaceholder('Enter your api key')
					.setValue(this.plugin.settings.airtableAPIKey)
					.onChange(async (value) => {
						this.plugin.settings.airtableAPIKey = value
						await this.plugin.saveSettings()
					})
			)
		new Setting(containerEl)
			.setName('Website URL')
			.setDesc('Where your website deployed')
			.addText((text) =>
				text
					.setValue(this.plugin.settings.websiteUrl)
					.onChange(async (value) => {
						this.plugin.settings.websiteUrl = value
						await this.plugin.saveSettings()
					})
			)
		new Setting(containerEl)
			.setName('Airtable Base ID')
			.setDesc('What is the base ID of your Airtable base')
			.addText((text) =>
				text
					.setValue(this.plugin.settings.airtableBase)
					.onChange(async (value) => {
						this.plugin.settings.airtableBase = value
						await this.plugin.saveSettings()
					})
			)
		new Setting(containerEl)
			.setName('Airtable View')
			.setDesc('What the name of the view you want to use')
			.addText((text) =>
				text
					.setValue(this.plugin.settings.airtableView)
					.onChange(async (value) => {
						this.plugin.settings.airtableView = value
						await this.plugin.saveSettings()
					})
			)
	}
}

export default class MyPlugin extends Plugin {
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

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open()
			},
		})

		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const {
					airtableAPIKey,
					websiteUrl,
					airtableBase,
					airtableView,
				} = this.settings
				if (!airtableAPIKey || !airtableBase || !airtableView) {
					new Notice(
						'You need to set your Airtable API Key and Base ID in the settings tab.'
					)
					return
				}

				const contents = editor.getValue()
				const { path, basename } = view.file
				const slug = this.slugify(path)
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
					new Notice('Found your note, updating...')
					const id = notes[0].getId()
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
					const link = `${websiteUrl}/notes/${this.slugify(
						updatedRecord.fields.slug
					)}`
					navigator.clipboard.writeText(link)
					new Notice(
						'Your updated note url has been copied to your clipboard'
					)
				} catch (e) {
					new Notice('There has been a problem publishing your site')
					return
				}
			},
		})

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this))
	}

	onunload() {}

	async createAirtableRecord(contents: string, path: string, title: string) {
		const { websiteUrl, airtableView } = this.settings
		new Notice('Creating your note')
		try {
			const [createdRecord] = await create({
				view: airtableView,
				base: this.base,
				record: {
					slug: this.slugify(path),
					data: contents,
					title: title,
				},
			})

			const link = `${websiteUrl}/notes/${this.slugify(
				createdRecord.fields.slug
			)}`
			navigator.clipboard.writeText(link)
			new Notice('Your note URL has been copied to the clipboard')
		} catch (e) {
			new Notice('There has been a problem publishing your site')
			return
		}
	}

	slugify(str: string) {
		str = str.replace(/^\s+|\s+$/g, '') // trim
		str = str.toLowerCase()

		// remove accents, swap ñ for n, etc
		var from = 'åàáãäâèéëêìíïîòóöôùúüûñç·/_,:;'
		var to = 'aaaaaaeeeeiiiioooouuuunc------'

		for (var i = 0, l = from.length; i < l; i++) {
			str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i))
		}

		str = str
			.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
			.replace(/\s+/g, '-') // collapse whitespace and replace by -
			.replace(/-+/g, '-') // collapse dashes
			.replace(/^-+/, '') // trim - from start of text
			.replace(/-+$/, '') // trim - from end of text

		return str
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

class SampleModal extends Modal {
	constructor(app: App) {
		super(app)
	}

	onOpen() {
		const { contentEl } = this
		contentEl.setText('Woah!')
	}

	onClose() {
		const { contentEl } = this
		contentEl.empty()
	}
}

import { App, Modal } from 'obsidian'
import PublishNotesPlugin from './main'
import { read } from './utils/airtableHelpers'

const buttonStyles = `
width: 100%;
cursor: pointer;
margin: 0;
margin-bottom: 1em;
`

const listStyles = `
list-style: none;
margin: 0;
padding: 0;
margin-top: 2em;
`

export class ListNotesModal extends Modal {
	plugin: PublishNotesPlugin

	constructor(app: App, plugin: PublishNotesPlugin) {
		super(app)
		this.plugin = plugin
	}

	async fetchNotes() {
		const { plugin } = this
		const notes = await read({
			base: plugin.base,
			view: plugin.settings.airtableView,
		})

		return notes.filter((note) => note.fields.slug)
	}

	async onOpen() {
		const {
			contentEl,
			titleEl,
			plugin: {
				settings: { websiteUrl },
			},
		} = this
		contentEl.empty()

		const notes = await this.fetchNotes()
		titleEl.setText('Your public notes')

		contentEl.innerHTML = `
			<ul style="${listStyles}">
${notes
	.map(
		({ fields: { slug, title } }) =>
			`<li><a href="${`${websiteUrl}/notes/${slug}`}"><button style="${buttonStyles}">${title}</li></button></a>`
	)
	.join('')}</ul>
		`
	}

	onClose() {
		const { contentEl } = this
		contentEl.empty()
	}
}

import { Setting } from 'obsidian'
import PublishNotesPlugin from './main'

export const createSettings = ({
	containerEl,
	plugin,
}: {
	containerEl: HTMLElement
	plugin: PublishNotesPlugin
}) => {
	new Setting(containerEl)
		.setName('Airtable API Key')
		.setDesc('This is not shared and it will stay local to your computer.')
		.addText((text) =>
			text
				.setPlaceholder('Enter your api key')
				.setValue(plugin.settings.airtableAPIKey)
				.onChange(async (value) => {
					plugin.settings.airtableAPIKey = value
					await plugin.saveSettings()
				})
		)

	new Setting(containerEl)
		.setName('Airtable Base ID')
		.setDesc('What is the base ID of your Airtable base')
		.addText((text) =>
			text
				.setValue(plugin.settings.airtableBase)
				.onChange(async (value) => {
					plugin.settings.airtableBase = value
					await plugin.saveSettings()
				})
		)
	new Setting(containerEl)
		.setName('Airtable View')
		.setDesc('What the name of the view you want to use')
		.addText((text) =>
			text
				.setValue(plugin.settings.airtableView)
				.onChange(async (value) => {
					plugin.settings.airtableView = value
					await plugin.saveSettings()
				})
		)
	new Setting(containerEl)
		.setName('Website URL')
		.setDesc('Where your website deployed')
		.addText((text) =>
			text
				.setValue(plugin.settings.websiteUrl)
				.onChange(async (value) => {
					plugin.settings.websiteUrl = value
					await plugin.saveSettings()
				})
		)

	if (!plugin.settings.websiteUrl) {
		new Setting(containerEl)
			.setName('Deploy Website to Netlify')
			.addButton((button) => {
				button
					.setButtonText('Deploy')
					.onClick(async () =>
						window.open(
							'https://app.netlify.com/start/deploy?repository=https://github.com/SaraVieira/obsidian-share-link-plugin'
						)
					)
			})
	}
}

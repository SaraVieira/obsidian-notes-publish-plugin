import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import Airtable from 'airtable'

interface ShareLinkPluginSettings {
	airtableAPIKey: string;
	airtableBase: string;
	websiteUrl: string;
	airtableView: string;
}

const DEFAULT_SETTINGS: ShareLinkPluginSettings = {
	airtableAPIKey: '',
	airtableBase: '',
	airtableView: '',
	websiteUrl: ''

}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Airtable API Key')
			.setDesc('This is not shared and it will stay local to your computer.')
			.addText(text => text
				.setPlaceholder('Enter your api key')
				.setValue(this.plugin.settings.airtableAPIKey)
				.onChange(async (value) => {
					this.plugin.settings.airtableAPIKey = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Website URL')
			.setDesc('Where your website deployed')
			.addText(text => text
				.setValue(this.plugin.settings.websiteUrl)
				.onChange(async (value) => {
					this.plugin.settings.websiteUrl = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Airtable Base ID')
			.setDesc('What is the base ID of your Airtable base')
			.addText(text => text
				.setValue(this.plugin.settings.airtableBase)
				.onChange(async (value) => {
					this.plugin.settings.airtableBase = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Airtable View')
			.setDesc('What the name of the view you want to use')
			.addText(text => text
				.setValue(this.plugin.settings.airtableView)
				.onChange(async (value) => {
					this.plugin.settings.airtableView = value;
					await this.plugin.saveSettings();
				}));
	}
}



export default class MyPlugin extends Plugin {
	settings: ShareLinkPluginSettings;
	base: any;

	async onload() {
		await this.loadSettings();
		this.base = new Airtable({ apiKey: this.settings.airtableAPIKey }).base(this.settings.airtableBase);
		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const { airtableAPIKey, airtableBase, airtableView } = this.settings;
				if (!airtableAPIKey || !airtableBase || !airtableView) {
					new Notice('You need to set your Airtable API Key and Base ID in the settings tab.');
					return
				}

				const contents = editor.getValue();
				const { path, basename } = view.file;

				this.base(airtableView).select({
					maxRecords: 1,
					filterByFormula: `{slug} = '${this.slugify(path)}'`
				}).eachPage(async (records: any[]) => {
					if (!records.length) {
						await this.createAirtableRecord(contents, path, basename)
						return
					}
					const id = records[0].getId()
					this.base(airtableView).update([
						{
							"id": id,
							"fields": {
								"slug": this.slugify(path),
								"data": contents,
								"title": basename
							}
						}
					], function (err: string, records: any[]) {
						if (err) {
							new Notice('There was an error updating your site. Please try again.');
							return;
						}
						records.forEach(function (record) {
							console.log(record.getId());
						});
					});

				}, (err: any) => {
					if (err) { new Notice('There has been a problem publishing your site'); return; }
				});
				editor.replaceSelection('Sample Editor Command');
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	onunload() {

	}

	createAirtableRecord(contents: string, path: string, title: string) {
		const { airtableView, websiteUrl } = this.settings;
		this.base(airtableView).create([
			{
				"fields": {
					"slug": this.slugify(path),
					"data": contents,
					"title": title
				}
			}
		], function (err: string, records: any[]) {
			if (err) {
				console.error(err);
				return;
			}
			records.forEach(function (record) {
				new Notice(websiteUrl);
			});
		});
	}

	slugify(str: string) {
		str = str.replace(/^\s+|\s+$/g, ""); // trim
		str = str.toLowerCase();

		// remove accents, swap ñ for n, etc
		var from = "åàáãäâèéëêìíïîòóöôùúüûñç·/_,:;";
		var to = "aaaaaaeeeeiiiioooouuuunc------";

		for (var i = 0, l = from.length; i < l; i++) {
			str = str.replace(new RegExp(from.charAt(i), "g"), to.charAt(i));
		}

		str = str
			.replace(/[^a-z0-9 -]/g, "") // remove invalid chars
			.replace(/\s+/g, "-") // collapse whitespace and replace by -
			.replace(/-+/g, "-") // collapse dashes
			.replace(/^-+/, "") // trim - from start of text
			.replace(/-+$/, ""); // trim - from end of text

		return str;
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}


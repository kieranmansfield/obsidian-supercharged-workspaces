import { App, PluginSettingTab, Setting } from "obsidian";
import SuperchargedWorkspacesPlugin from "../main";
import { WorkspaceConfig } from "./types";

export class SettingsTab extends PluginSettingTab {
	plugin: SuperchargedWorkspacesPlugin;

	constructor(app: App, plugin: SuperchargedWorkspacesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", {
			text: "Supercharged Workspaces Settings",
		});

		new Setting(containerEl)
			.setName("Show status bar")
			.setDesc("Display current workspace name in the status bar")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showStatusBar)
					.onChange(async (value) => {
						this.plugin.settings.showStatusBar = value;
						await this.plugin.saveSettings();
						this.plugin.updateStatusBarVisibility();
					})
			);

		new Setting(containerEl)
			.setName("Auto-save current workspace")
			.setDesc(
				"Automatically save workspace layout changes (experimental)"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoSave)
					.onChange(async (value) => {
						this.plugin.settings.autoSave = value;
						await this.plugin.saveSettings();
					})
			);

		// Workspace statistics
		containerEl.createEl("h3", { text: "Workspace Statistics" });

		const workspaces = this.plugin.workspaceManager.getAllWorkspaces();
		const statsDiv = containerEl.createDiv("supercharged-workspaces-stats");

		statsDiv.createEl("p", {
			text: `Total saved workspaces: ${workspaces.length}`,
		});

		if (workspaces.length > 0) {
			const oldestDate = new Date(
				Math.min(...workspaces.map((w: WorkspaceConfig) => w.createdAt))
			).toLocaleDateString();
			statsDiv.createEl("p", {
				text: `Oldest workspace: ${oldestDate}`,
			});
		}

		// Workspace Commands
		containerEl.createEl("h3", { text: "Workspace Commands" });
		containerEl.createEl("p", {
			text: "Enable command palette commands for quick access to specific workspaces",
			cls: "setting-item-description",
		});

		if (workspaces.length === 0) {
			containerEl.createEl("p", {
				text: "No workspaces available. Create a workspace first.",
				cls: "setting-item-description",
			});
		} else {
			workspaces.forEach((workspace) => {
				const setting = new Setting(containerEl)
					.setName(
						(workspace.icon ? workspace.icon + " " : "") +
							workspace.name
					)
					.setDesc(
						workspace.description ||
							"Load this workspace from command palette"
					)
					.addToggle((toggle) =>
						toggle
							.setValue(workspace.commandEnabled || false)
							.onChange(async (value) => {
								workspace.commandEnabled = value;
								await this.plugin.saveSettings();
								this.plugin.registerWorkspaceCommands();
							})
					);
			});
		}
	}
}

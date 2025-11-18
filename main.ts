import { Plugin } from "obsidian";
import { PluginSettings, DEFAULT_SETTINGS } from "./src/types";
import { WorkspaceManager } from "./src/WorkspaceManager";
import { registerCommands } from "./src/commands";
import { SettingsTab } from "./src/SettingsTab";
import { WorkspaceFuzzySuggestModal } from "./src/WorkspaceModal";

export default class SuperchargedWorkspacesPlugin extends Plugin {
	settings: PluginSettings;
	workspaceManager: WorkspaceManager;
	statusBarItem: HTMLElement | null = null;
	workspaceCommands: string[] = [];

	async onload() {
		await this.loadSettings();

		// Initialize workspace manager
		this.workspaceManager = new WorkspaceManager(
			this.app,
			() => this.settings.workspaces,
			() => this.saveSettings()
		);

		// Register commands
		registerCommands(
			this,
			this.workspaceManager,
			(workspaceId: string | null) => this.updateStatusBar(workspaceId)
		);

		// Add ribbon icon
		this.addRibbonIcon("layout-dashboard", "Load Workspace", () => {
			new WorkspaceFuzzySuggestModal(
				this.app,
				this.workspaceManager,
				(workspaceId: string) => this.updateStatusBar(workspaceId)
			).open();
		});

		// Add status bar item
		this.statusBarItem = this.addStatusBarItem();
		this.updateStatusBar(this.settings.activeWorkspaceId);

		// Add settings tab
		this.addSettingTab(new SettingsTab(this.app, this));

		// Register individual workspace commands
		this.registerWorkspaceCommands();

		// Listen for layout changes if auto-save is enabled
		this.registerEvent(
			this.app.workspace.on("layout-change", () => {
				if (this.settings.autoSave && this.settings.activeWorkspaceId) {
					this.autoSaveWorkspace();
				}
			})
		);
	}

	onunload() {
		// Cleanup is handled automatically by registerEvent
	}

	async loadSettings() {
		const data = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
		// Convert enabledCommands array back to Set if it was saved as array
		if (data?.enabledCommands && Array.isArray(data.enabledCommands)) {
			this.settings.enabledCommands = new Set(data.enabledCommands);
		} else {
			this.settings.enabledCommands = new Set();
		}
	}

	async saveSettings() {
		// Convert Set to array for JSON serialization
		const dataToSave = {
			...this.settings,
			enabledCommands: Array.from(this.settings.enabledCommands),
		};
		await this.saveData(dataToSave);
	}

	updateStatusBar(workspaceId: string | null) {
		if (!this.statusBarItem) return;

		this.settings.activeWorkspaceId = workspaceId;
		this.saveSettings();

		if (!this.settings.showStatusBar) {
			this.statusBarItem.style.display = "none";
			return;
		}

		this.statusBarItem.style.display = "block";

		if (workspaceId) {
			const workspace =
				this.workspaceManager.getWorkspaceById(workspaceId);
			if (workspace) {
				const icon = workspace.icon || "📋";
				this.statusBarItem.setText(`${icon} ${workspace.name}`);
				this.statusBarItem.addClass("mod-clickable");
				this.statusBarItem.onclick = (event: MouseEvent) => {
					this.showWorkspaceMenu(event);
				};
			}
		} else {
			this.statusBarItem.setText("📋 No workspace");
			this.statusBarItem.addClass("mod-clickable");
			this.statusBarItem.onclick = (event: MouseEvent) => {
				this.showWorkspaceMenu(event);
			};
		}
	}

	updateStatusBarVisibility() {
		if (this.statusBarItem) {
			this.statusBarItem.style.display = this.settings.showStatusBar
				? "block"
				: "none";
		}
	}

	private autoSaveWorkspace() {
		if (!this.settings.activeWorkspaceId) return;

		const layout = this.app.workspace.getLayout();
		this.workspaceManager.updateWorkspace(this.settings.activeWorkspaceId, {
			layout,
			updatedAt: Date.now(),
		});
	}

	private showWorkspaceMenu(event: MouseEvent) {
		const menu = new (require("obsidian").Menu)();
		const workspaces = this.workspaceManager.getAllWorkspaces();

		if (workspaces.length === 0) {
			menu.addItem((item: any) => {
				item.setTitle("No workspaces saved").setDisabled(true);
			});
		} else {
			workspaces.forEach((workspace) => {
				menu.addItem((item: any) => {
					const icon = workspace.icon || "📋";
					const isActive =
						workspace.id === this.settings.activeWorkspaceId;

					item.setTitle(`${icon} ${workspace.name}`)
						.setChecked(isActive)
						.onClick(async () => {
							await this.workspaceManager.loadWorkspace(
								workspace.id
							);
							this.updateStatusBar(workspace.id);
						});
				});
			});
		}

		menu.showAtMouseEvent(event);
	}

	registerWorkspaceCommands() {
		// Note: Obsidian doesn't provide a way to remove commands,
		// so we track which ones are registered and only add new ones
		// Plugin reload is required for command changes to take full effect

		// Register commands for enabled workspaces
		const workspaces = this.workspaceManager.getAllWorkspaces();
		workspaces.forEach((workspace) => {
			if (workspace.commandEnabled) {
				const commandId = `load-workspace-${workspace.id}`;

				// Check if command is already registered
				if (!this.workspaceCommands.includes(commandId)) {
					const commandName = `Load workspace: ${
						workspace.icon ? workspace.icon + " " : ""
					}${workspace.name}`;

					this.addCommand({
						id: commandId,
						name: commandName,
						callback: async () => {
							await this.workspaceManager.loadWorkspace(
								workspace.id
							);
							this.updateStatusBar(workspace.id);
						},
					});

					this.workspaceCommands.push(commandId);
				}
			}
		});
	}
}

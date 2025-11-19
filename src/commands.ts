import { Plugin, Modal, Notice } from "obsidian";
import { WorkspaceManager } from "./WorkspaceManager";
import {
	WorkspaceManagementModal,
	SaveWorkspaceModal,
	WorkspaceFuzzySuggestModal,
	EditWorkspaceFuzzySuggestModal,
	FilteredWorkspaceFuzzySuggestModal,
} from "./WorkspaceModal";
import { WorkspaceConfig, WorkspaceFolder } from "./types";

export function registerCommands(
	plugin: Plugin,
	workspaceManager: WorkspaceManager,
	updateStatusBar: (workspaceId: string | null) => void
) {
	// Save current workspace
	plugin.addCommand({
		id: "save-workspace",
		name: "Save current workspace",
		callback: () => {
			new SaveWorkspaceModal(
				plugin.app,
				workspaceManager,
				plugin as any,
				(workspace: WorkspaceConfig) => {
					updateStatusBar(workspace.id);
					(plugin as any).refreshWorkspacesView?.();
				}
			).open();
		},
	});

	// Create new workspace from current layout (alias for clarity)
	plugin.addCommand({
		id: "create-new-workspace",
		name: "Create new workspace from current layout",
		callback: () => {
			new SaveWorkspaceModal(
				plugin.app,
				workspaceManager,
				plugin as any,
				(workspace: WorkspaceConfig) => {
					updateStatusBar(workspace.id);
					(plugin as any).refreshWorkspacesView?.();
				}
			).open();
		},
	});

	// Manage workspaces
	plugin.addCommand({
		id: "manage-workspaces",
		name: "Manage workspaces",
		callback: () => {
			new WorkspaceManagementModal(
				plugin.app,
				workspaceManager,
				plugin as any,
				(workspaceId: string) => {
					updateStatusBar(workspaceId);
				}
			).open();
		},
	});

	// Load workspace (with fuzzy search)
	plugin.addCommand({
		id: "load-workspace",
		name: "Load workspace",
		callback: () => {
			new WorkspaceFuzzySuggestModal(
				plugin.app,
				workspaceManager,
				(workspaceId: string) => {
					updateStatusBar(workspaceId);
					(plugin as any).refreshWorkspacesView?.();
				}
			).open();
		},
	});

	// Edit workspace
	plugin.addCommand({
		id: "edit-workspace",
		name: "Edit workspace",
		callback: () => {
			new EditWorkspaceFuzzySuggestModal(
				plugin.app,
				workspaceManager,
				plugin as any
			).open();
			// Note: refresh happens in RenameWorkspaceModal save
		},
	});

	// Update current workspace (overwrite)
	plugin.addCommand({
		id: "update-current-workspace",
		name: "Update current workspace",
		callback: async () => {
			// Get the active workspace ID from plugin settings
			const activeWorkspaceId = (plugin as any).settings
				?.activeWorkspaceId;

			if (!activeWorkspaceId) {
				return;
			}

			const layout = plugin.app.workspace.getLayout();

			await workspaceManager.updateWorkspace(activeWorkspaceId, {
				layout,
				updatedAt: Date.now(),
			});

			// Refresh the panel
			(plugin as any).refreshWorkspacesView?.();
		},
	});

	// Smart Group Commands
	plugin.addCommand({
		id: "show-all-workspaces",
		name: "Show all workspaces",
		callback: () => {
			(plugin as any).settings.activeSmartGroup = "all";
			(plugin as any).saveSettings();
			(plugin as any).refreshWorkspacesView?.();
		},
	});

	// Recent workspaces command (only if enabled)
	if ((plugin as any).settings.enableRecent) {
		plugin.addCommand({
			id: "show-recent-workspaces",
			name: "Show recent workspaces",
			callback: () => {
				new FilteredWorkspaceFuzzySuggestModal(
					plugin.app,
					workspaceManager,
					"recent",
					(workspaceId: string) => {
						updateStatusBar(workspaceId);
						(plugin as any).refreshWorkspacesView?.();
					}
				).open();
			},
		});
	}

	// Pinned workspaces command (only if enabled)
	if ((plugin as any).settings.enablePin) {
		plugin.addCommand({
			id: "show-pinned-workspaces",
			name: "Show pinned workspaces",
			callback: () => {
				new FilteredWorkspaceFuzzySuggestModal(
					plugin.app,
					workspaceManager,
					"pinned",
					(workspaceId: string) => {
						updateStatusBar(workspaceId);
						(plugin as any).refreshWorkspacesView?.();
					}
				).open();
			},
		});
	}

	// Favorites workspaces command (only if enabled)
	if ((plugin as any).settings.enableStar) {
		plugin.addCommand({
			id: "show-favorites-workspaces",
			name: "Show favorite workspaces",
			callback: () => {
				new FilteredWorkspaceFuzzySuggestModal(
					plugin.app,
					workspaceManager,
					"favorites",
					(workspaceId: string) => {
						updateStatusBar(workspaceId);
						(plugin as any).refreshWorkspacesView?.();
					}
				).open();
			},
		});
	}

	plugin.addCommand({
		id: "clear-smart-group-filter",
		name: "Clear smart group filter",
		callback: () => {
			(plugin as any).settings.activeSmartGroup = null;
			(plugin as any).saveSettings();
			(plugin as any).refreshWorkspacesView?.();
		},
	});

	// Create new folder (only if beta enabled)
	if ((plugin as any).settings.enableBetaFolders) {
		plugin.addCommand({
			id: "create-folder",
			name: "Create workspace folder",
			callback: () => {
				createFolderPrompt(plugin);
			},
		});
	}
}

export function createFolderPrompt(plugin: Plugin) {
	const modal = new Modal(plugin.app);
	modal.titleEl.setText("Create workspace folder");

	let folderName = "";
	let folderIcon = "";
	let folderColor = "";

	// Name input
	modal.contentEl.createEl("p", {
		text: "Folder name:",
		cls: "setting-item-name",
	});
	const nameInput = modal.contentEl.createEl("input", {
		type: "text",
		placeholder: "My Folder",
	});
	nameInput.style.width = "100%";
	nameInput.style.marginBottom = "1em";
	nameInput.addEventListener("input", (e) => {
		folderName = (e.target as HTMLInputElement).value;
	});

	// Icon input (optional)
	modal.contentEl.createEl("p", {
		text: "Emoji icon (optional):",
		cls: "setting-item-name",
	});
	const iconInput = modal.contentEl.createEl("input", {
		type: "text",
		placeholder: "📁",
	});
	iconInput.style.width = "100%";
	iconInput.style.marginBottom = "1em";
	iconInput.addEventListener("input", (e) => {
		folderIcon = (e.target as HTMLInputElement).value;
	});

	// Color picker
	modal.contentEl.createEl("p", {
		text: "Color (optional):",
		cls: "setting-item-name",
	});
	const colorContainer = modal.contentEl.createDiv("folder-color-picker");
	colorContainer.style.display = "flex";
	colorContainer.style.gap = "8px";
	colorContainer.style.marginBottom = "1em";

	const colors = [
		{ name: "None", value: "" },
		{ name: "Red", value: "#e74c3c" },
		{ name: "Blue", value: "#3498db" },
		{ name: "Green", value: "#2ecc71" },
		{ name: "Yellow", value: "#f39c12" },
		{ name: "Purple", value: "#9b59b6" },
		{ name: "Orange", value: "#e67e22" },
		{ name: "Pink", value: "#ff69b4" },
	];

	colors.forEach((color) => {
		const colorBtn = colorContainer.createEl("button", {
			cls: "color-swatch",
		});
		colorBtn.style.width = "24px";
		colorBtn.style.height = "24px";
		colorBtn.style.border = "1px solid var(--background-modifier-border)";
		colorBtn.style.borderRadius = "4px";
		colorBtn.style.cursor = "pointer";
		colorBtn.style.backgroundColor = color.value || "transparent";
		colorBtn.setAttribute("aria-label", color.name);

		colorBtn.addEventListener("click", () => {
			folderColor = color.value;
			// Update visual feedback
			colorContainer.querySelectorAll(".color-swatch").forEach((btn) => {
				(btn as HTMLElement).style.outline = "none";
			});
			colorBtn.style.outline = "2px solid var(--interactive-accent)";
			colorBtn.style.outlineOffset = "2px";
		});
	});

	const buttonContainer = modal.contentEl.createDiv("modal-button-container");

	buttonContainer
		.createEl("button", { text: "Cancel" })
		.addEventListener("click", () => {
			modal.close();
		});

	const createBtn = buttonContainer.createEl("button", {
		text: "Create",
		cls: "mod-cta",
	});
	createBtn.addEventListener("click", async () => {
		const name = folderName.trim();
		if (!name) {
			new Notice("Please enter a folder name");
			return;
		}

		const settings = (plugin as any).settings;
		const folderId = `folder-${Date.now()}`;

		const newFolder: WorkspaceFolder = {
			id: folderId,
			name: name,
			icon: folderIcon.trim() || undefined,
			color: folderColor || undefined,
			order: Object.keys(settings.folders).length,
			collapsed: false,
		};

		settings.folders[folderId] = newFolder;
		settings.folderOrder.push(folderId);

		await (plugin as any).saveSettings();

		// Refresh the view
		if ((plugin as any).refreshWorkspacesView) {
			(plugin as any).refreshWorkspacesView();
		}

		new Notice(`Folder "${name}" created`);
		modal.close();
	});

	nameInput.addEventListener("keydown", (e) => {
		if (e.key === "Enter") {
			createBtn.click();
		} else if (e.key === "Escape") {
			modal.close();
		}
	});

	modal.open();
	nameInput.focus();
}

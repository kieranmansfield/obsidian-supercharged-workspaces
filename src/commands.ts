import { Plugin } from "obsidian";
import { WorkspaceManager } from "./WorkspaceManager";
import {
	WorkspaceManagementModal,
	SaveWorkspaceModal,
	WorkspaceFuzzySuggestModal,
	EditWorkspaceFuzzySuggestModal,
} from "./WorkspaceModal";
import { WorkspaceConfig } from "./types";

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
				(workspace: WorkspaceConfig) => {
					updateStatusBar(workspace.id);
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
				(workspace: WorkspaceConfig) => {
					updateStatusBar(workspace.id);
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
				workspaceManager
			).open();
		},
	});

	// Update current workspace (overwrite)
	plugin.addCommand({
		id: "update-current-workspace",
		name: "Update current workspace",
		callback: async () => {
			const workspaces = workspaceManager.getAllWorkspaces();
			if (workspaces.length === 0) {
				return;
			}

			// Use the most recently used workspace
			const currentWorkspace = workspaces[0];
			const layout = plugin.app.workspace.getLayout();

			await workspaceManager.updateWorkspace(currentWorkspace.id, {
				layout,
				updatedAt: Date.now(),
			});
		},
	});
}

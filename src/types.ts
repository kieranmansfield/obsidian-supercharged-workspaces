export interface WorkspaceConfig {
	id: string;
	name: string;
	description?: string;
	layout: any; // Obsidian's workspace layout object
	createdAt: number;
	updatedAt: number;
	icon?: string;
	commandEnabled?: boolean;
}

export interface PluginSettings {
	workspaces: Record<string, WorkspaceConfig>;
	activeWorkspaceId: string | null;
	autoSave: boolean;
	showStatusBar: boolean;
	enabledCommands: Set<string>;
}

export const DEFAULT_SETTINGS: PluginSettings = {
	workspaces: {},
	activeWorkspaceId: null,
	autoSave: false,
	showStatusBar: true,
	enabledCommands: new Set(),
};

import { App, FuzzySuggestModal, Modal, Notice, Setting, Menu } from "obsidian";
import { WorkspaceConfig } from "./types";
import { WorkspaceManager } from "./WorkspaceManager";

export class WorkspaceManagementModal extends Modal {
	constructor(
		app: App,
		private workspaceManager: WorkspaceManager,
		private onWorkspaceLoad?: (id: string) => void
	) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("supercharged-workspaces-modal");

		contentEl.createEl("h2", { text: "Manage Workspaces" });

		const workspaces = this.workspaceManager.getAllWorkspaces();

		if (workspaces.length === 0) {
			contentEl.createEl("p", {
				text: 'No saved workspaces yet. Use "Save current workspace" to create one.',
				cls: "supercharged-workspaces-empty",
			});
			return;
		}

		const listContainer = contentEl.createDiv(
			"supercharged-workspaces-list"
		);

		workspaces.forEach((workspace) => {
			const item = listContainer.createDiv("supercharged-workspace-item");

			const info = item.createDiv("workspace-info");

			const header = info.createDiv("workspace-header");
			if (workspace.icon) {
				header.createSpan({
					text: workspace.icon,
					cls: "workspace-icon",
				});
			}
			header.createEl("h3", { text: workspace.name });

			const meta = info.createDiv("workspace-meta");
			const date = new Date(workspace.updatedAt).toLocaleString();
			meta.createEl("span", { text: `Last updated: ${date}` });

			if (workspace.description) {
				info.createEl("p", {
					text: workspace.description,
					cls: "workspace-description",
				});
			}

			const actions = item.createDiv("workspace-actions");

			// Load button
			const loadBtn = actions.createEl("button", { text: "Load" });
			loadBtn.addEventListener("click", async () => {
				await this.workspaceManager.loadWorkspace(workspace.id);
				if (this.onWorkspaceLoad) {
					this.onWorkspaceLoad(workspace.id);
				}
				this.close();
			});

			// Edit button
			const editBtn = actions.createEl("button", { text: "Edit" });
			editBtn.addEventListener("click", () => {
				this.close();
				new RenameWorkspaceModal(
					this.app,
					this.workspaceManager,
					workspace
				).open();
			});

			// Delete button
			const deleteBtn = actions.createEl("button", {
				text: "Delete",
				cls: "mod-warning",
			});
			deleteBtn.addEventListener("click", async () => {
				if (confirm(`Delete workspace "${workspace.name}"?`)) {
					await this.workspaceManager.deleteWorkspace(workspace.id);
					this.onOpen(); // Refresh the list
				}
			});
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

export class WorkspaceFuzzySuggestModal extends FuzzySuggestModal<WorkspaceConfig> {
	constructor(
		app: App,
		private workspaceManager: WorkspaceManager,
		private onWorkspaceLoad?: (id: string) => void
	) {
		super(app);
		this.setPlaceholder("Type to search workspaces...");
	}

	getItems(): WorkspaceConfig[] {
		return this.workspaceManager.getAllWorkspaces();
	}

	getItemText(workspace: WorkspaceConfig): string {
		// Include description in searchable text if it exists
		if (workspace.description) {
			return `${workspace.name} ${workspace.description}`;
		}
		return workspace.name;
	}

	renderSuggestion(item: { item: WorkspaceConfig }, el: HTMLElement) {
		const workspace = item.item;
		el.createDiv({ cls: "workspace-fuzzy-item" }, (div) => {
			const nameContainer = div.createDiv({
				cls: "workspace-fuzzy-name",
			});
			if (workspace.icon) {
				nameContainer.createSpan({
					text: workspace.icon + " ",
					cls: "workspace-icon",
				});
			}
			nameContainer.createSpan({ text: workspace.name });
			if (workspace.description) {
				div.createDiv({
					text: workspace.description,
					cls: "workspace-fuzzy-description",
				});
			}
			const date = new Date(workspace.updatedAt).toLocaleDateString();
			div.createDiv({
				text: `Last updated: ${date}`,
				cls: "workspace-fuzzy-meta",
			});
		});
	}

	async onChooseItem(workspace: WorkspaceConfig) {
		await this.workspaceManager.loadWorkspace(workspace.id);
		if (this.onWorkspaceLoad) {
			this.onWorkspaceLoad(workspace.id);
		}
	}
}

export class SaveWorkspaceModal extends Modal {
	private name = "";
	private description = "";
	private icon = "";

	constructor(
		app: App,
		private workspaceManager: WorkspaceManager,
		private onSave?: (workspace: WorkspaceConfig) => void
	) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", { text: "Save Workspace" });

		new Setting(contentEl)
			.setName("Emoji icon (optional)")
			.setDesc("Enter a single emoji to identify this workspace")
			.addText((text) =>
				text
					.setPlaceholder("")
					.setValue(this.icon)
					.onChange((value) => {
						this.icon = value;
					})
			);

		new Setting(contentEl)
			.setName("Workspace name")
			.setDesc("Enter a name for this workspace")
			.addText((text) =>
				text
					.setPlaceholder("My Workspace")
					.setValue(this.name)
					.onChange((value) => {
						this.name = value;
					})
			);

		new Setting(contentEl)
			.setName("Description (optional)")
			.setDesc(
				"Add a description to help remember what this workspace is for"
			)
			.addTextArea((text) =>
				text
					.setPlaceholder("Used for writing blog posts...")
					.setValue(this.description)
					.onChange((value) => {
						this.description = value;
					})
			);

		new Setting(contentEl)
			.addButton((btn) =>
				btn.setButtonText("Cancel").onClick(() => {
					this.close();
				})
			)
			.addButton((btn) =>
				btn
					.setButtonText("Save")
					.setCta()
					.onClick(async () => {
						if (!this.name.trim()) {
							new Notice("Please enter a workspace name");
							return;
						}
						const workspace =
							await this.workspaceManager.saveWorkspace(
								this.name.trim(),
								this.description.trim() || undefined,
								this.icon.trim() || undefined
							);
						if (this.onSave) {
							this.onSave(workspace);
						}
						this.close();
					})
			);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

export class RenameWorkspaceModal extends Modal {
	private name: string;
	private description: string;
	private icon: string;

	constructor(
		app: App,
		private workspaceManager: WorkspaceManager,
		private workspace: WorkspaceConfig
	) {
		super(app);
		this.name = workspace.name;
		this.description = workspace.description || "";
		this.icon = workspace.icon || "";
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", { text: "Edit Workspace" });

		new Setting(contentEl)
			.setName("Emoji icon (optional)")
			.setDesc("Enter a single emoji to identify this workspace")
			.addText((text) =>
				text
					.setPlaceholder("")
					.setValue(this.icon)
					.onChange((value) => {
						this.icon = value;
					})
			);

		new Setting(contentEl).setName("Workspace name").addText((text) =>
			text
				.setPlaceholder("My Workspace")
				.setValue(this.name)
				.onChange((value) => {
					this.name = value;
				})
		);

		new Setting(contentEl)
			.setName("Description (optional)")
			.addTextArea((text) =>
				text
					.setPlaceholder("Used for writing blog posts...")
					.setValue(this.description)
					.onChange((value) => {
						this.description = value;
					})
			);

		new Setting(contentEl)
			.addButton((btn) =>
				btn.setButtonText("Cancel").onClick(() => {
					this.close();
				})
			)
			.addButton((btn) =>
				btn
					.setButtonText("Save")
					.setCta()
					.onClick(async () => {
						if (!this.name.trim()) {
							new Notice("Please enter a workspace name");
							return;
						}
						await this.workspaceManager.updateWorkspace(
							this.workspace.id,
							{
								name: this.name.trim(),
								description:
									this.description.trim() || undefined,
								icon: this.icon.trim() || undefined,
							}
						);
						this.close();
					})
			);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

export class EditWorkspaceFuzzySuggestModal extends FuzzySuggestModal<WorkspaceConfig> {
	constructor(app: App, private workspaceManager: WorkspaceManager) {
		super(app);
		this.setPlaceholder("Select workspace to edit...");
	}

	getItems(): WorkspaceConfig[] {
		return this.workspaceManager.getAllWorkspaces();
	}

	getItemText(workspace: WorkspaceConfig): string {
		if (workspace.description) {
			return `${workspace.name} ${workspace.description}`;
		}
		return workspace.name;
	}

	renderSuggestion(item: { item: WorkspaceConfig }, el: HTMLElement) {
		const workspace = item.item;
		el.createDiv({ cls: "workspace-fuzzy-item" }, (div) => {
			const nameContainer = div.createDiv({
				cls: "workspace-fuzzy-name",
			});
			if (workspace.icon) {
				nameContainer.createSpan({
					text: workspace.icon + " ",
					cls: "workspace-icon",
				});
			}
			nameContainer.createSpan({ text: workspace.name });
			if (workspace.description) {
				div.createDiv({
					text: workspace.description,
					cls: "workspace-fuzzy-description",
				});
			}
		});
	}

	async onChooseItem(workspace: WorkspaceConfig) {
		new RenameWorkspaceModal(
			this.app,
			this.workspaceManager,
			workspace
		).open();
	}
}

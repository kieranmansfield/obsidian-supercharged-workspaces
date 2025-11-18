# Supercharged Workspaces

A powerful Obsidian plugin that enhances workspace management by allowing you to save, load, and manage multiple workspace layouts with ease.

## Features

### 🚀 Core Functionality

-   **Save Workspaces**: Capture your current pane layout, open files, and workspace state
-   **Load Workspaces**: Instantly switch between different workspace configurations
-   **Manage Workspaces**: Rename, update, and delete saved workspaces
-   **Status Bar Integration**: See your current workspace at a glance
-   **Quick Switching**: Click the status bar to quickly switch workspaces

### 🎯 Use Cases

-   **Writing Mode**: Minimal layout focused on your current document
-   **Research Mode**: Multiple reference panes with graph view and backlinks
-   **Review Mode**: Side-by-side comparison with calendar and daily notes
-   **Project Workspaces**: Different layouts for different projects or contexts

## Usage

### Commands

Access these commands via the Command Palette (`Cmd/Ctrl + P`):

-   **Save current workspace**: Save your current layout with a name and description
-   **Load workspace**: Open the workspace manager to select and load a workspace
-   **Manage workspaces**: View all workspaces, rename, or delete them
-   **Update current workspace**: Overwrite the most recently used workspace with current layout

### Quick Access

-   **Ribbon Icon**: Click the 📋 icon in the left sidebar to open workspace manager
-   **Status Bar**: Click the workspace name in the status bar to switch workspaces

### Saving a Workspace

1. Arrange your panes exactly how you want them
2. Open Command Palette and run "Save current workspace"
3. Enter a name (e.g., "Writing Mode", "Research Layout")
4. Optionally add a description
5. Click Save

### Loading a Workspace

1. Click the workspace name in the status bar, or
2. Use the ribbon icon, or
3. Run "Load workspace" from Command Palette
4. Click "Load" on the workspace you want to switch to

### Managing Workspaces

From the workspace manager modal, you can:

-   **Load**: Switch to that workspace layout
-   **Rename**: Change the name or description
-   **Delete**: Remove the workspace (with confirmation)

## Settings

Access settings via **Settings → Community plugins → Supercharged Workspaces**

-   **Show status bar**: Toggle workspace name display in status bar
-   **Auto-save current workspace**: Automatically update workspace when layout changes (experimental)
-   **Workspace Statistics**: View how many workspaces you have saved

## Installation

### Manual Installation for Development

```bash
# Navigate to your vault's plugin folder
cd /path/to/vault/.obsidian/plugins/

# Clone or copy this plugin
# Then install and build
npm install
npm run build

# Reload Obsidian and enable the plugin
```

## Technical Details

### Data Structure

Workspaces are stored as JSON objects containing:

-   **ID**: Unique identifier
-   **Name**: User-friendly name
-   **Description**: Optional description
-   **Layout**: Complete Obsidian workspace layout object
-   **Timestamps**: Created and last updated times

### Storage

All workspace data is stored in the plugin's data file at `.obsidian/plugins/obsidian-supercharged-workspaces/data.json`

### Compatibility

-   **Desktop**: Full support (Windows, macOS, Linux)
-   **Mobile**: Full support (iOS, Android)
-   **Minimum Obsidian Version**: 0.15.0

## Roadmap

Future enhancements planned:

-   🔖 Workspace tags and categories
-   ⌨️ Custom hotkeys per workspace
-   🎨 Workspace-specific themes
-   📊 Workspace usage analytics
-   ⏰ Time-based workspace switching
-   📁 Context-aware workspace detection
-   🔄 Import/export workspace configurations
-   👥 Workspace sharing

## License

MIT License - see LICENSE file for details.

## Author

Created by Kieran Mansfield

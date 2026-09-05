import { TreeItem, ThemeIcon, Expanded, None } from '../../vscode';

/** Constructs a tree item to be used in the shell snippet view */
export class ShellTreeItem extends TreeItem {
	constructor(
		public override readonly label: string,
		public readonly isLocal: boolean,
		public readonly runImmediately: boolean,
		public readonly profile: string
	) {
		super(label, None);
		this.contextValue = 'shell-snippet';
	}
}

/** Constructs a dropdown to organize shell items */
export class ShellTreeDropdown extends TreeItem {
	constructor(
		public override readonly label: string,
		public readonly hasItems: boolean,
		public readonly icon: string,
		public readonly isLocal: boolean
	) {
		super(label, hasItems ? Expanded : None);
		this.iconPath = new ThemeIcon(icon);
		this.contextValue = 'shell-dropdown';
	}
}

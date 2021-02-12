import { MessageItem, Uri, window, workspace } from "vscode";
import { LoggingService } from "./LoggingService";
import {
  OUTDATED_PRETTIER_VERSION_MESSAGE,
  VIEW_LOGS_ACTION_TEXT,
} from "./message";

export enum ConfirmationSelection {
  deny = 1,
  allow = 2,
  alwaysAllow = 3,
}

interface ConfirmMessageItem extends MessageItem {
  value: ConfirmationSelection;
}

export class NotificationService {
  constructor(private loggingService: LoggingService) {}

  public warnOutdatedPrettierVersion(prettierPath?: string) {
    window.showErrorMessage(
      OUTDATED_PRETTIER_VERSION_MESSAGE.replace(
        "{{path}}",
        prettierPath || "unknown"
      )
    );
  }

  public async askForModuleApproval(
    modulePath: string,
    isGlobal: boolean
  ): Promise<ConfirmationSelection> {
    const libraryUri = Uri.file(modulePath);
    const folder = workspace.getWorkspaceFolder(libraryUri);
    let message: string;
    if (folder !== undefined) {
      const relativePath = workspace.asRelativePath(libraryUri);
      message = `The Prettier extension will use '${relativePath}' for validation, which is installed locally in folder '${folder.name}'. Do you allow the execution of this Prettier version including all plugins and configuration files it will load on your behalf?\n\nPress 'Allow Everywhere' to remember the choice for all workspaces.`;
    } else {
      message = isGlobal
        ? `The Prettier extension will use a globally installed Prettier library for validation. Do you allow the execution of this Prettier version including all plugins and configuration files it will load on your behalf?\n\nPress 'Always Allow' to remember the choice for all workspaces.`
        : `The Prettier extension will use a locally installed Prettier library for validation. Do you allow the execution of this Prettier version including all plugins and configuration files it will load on your behalf?\n\nPress 'Always Allow' to remember the choice for all workspaces.`;
    }

    const messageItems: ConfirmMessageItem[] = [
      { title: "Allow Everywhere", value: ConfirmationSelection.alwaysAllow },
      { title: "Allow", value: ConfirmationSelection.allow },
      { title: "Deny", value: ConfirmationSelection.deny },
    ];
    const item = await window.showInformationMessage<ConfirmMessageItem>(
      message,
      { modal: true },
      ...messageItems
    );

    // Dialog got canceled.
    if (item === undefined) {
      return ConfirmationSelection.deny;
    } else {
      return item.value;
    }
  }

  public async showErrorMessage(message: string, extraLines?: string[]) {
    let result: string | undefined;
    if (extraLines) {
      const lines = [message];
      lines.push(...extraLines);
      result = await window.showErrorMessage(
        lines.join(" "),
        VIEW_LOGS_ACTION_TEXT
      );
    } else {
      result = await window.showErrorMessage(message, VIEW_LOGS_ACTION_TEXT);
    }
    if (result && result === VIEW_LOGS_ACTION_TEXT) {
      this.loggingService.show();
    }
  }
}

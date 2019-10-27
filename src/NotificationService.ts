// tslint:disable-next-line: no-implicit-dependencies
import { window } from "vscode";
import * as nls from "vscode-nls";
import { PrettierModule } from "./types";

const localize = nls.config()();

export class NotificationService {
  public warnOutdatedPrettierVersion(
    prettierInstance?: PrettierModule,
    prettierPath?: string
  ) {
    const message = localize(
      "ext.config.outdatedPrettiereVersion",
      "Outdated version of prettier detected. Upgrade to latest."
    ).replace("{{path}}", prettierPath || "unknown");
    window.showErrorMessage(message);
  }
}

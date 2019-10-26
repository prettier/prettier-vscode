import * as semver from "semver";
// tslint:disable-next-line: no-implicit-dependencies
import { window } from "vscode";
import * as nls from "vscode-nls";
import { PrettierModule } from "./types";

const localize = nls.config()();

const minPrettierVersion = "1.10.0";

export class NotificationService {
  public assertValidPrettierVersion(
    prettierInstance?: PrettierModule,
    prettierPath?: string
  ) {
    if (
      prettierInstance &&
      prettierInstance.version &&
      semver.lte(prettierInstance.version, minPrettierVersion)
    ) {
      const message = localize(
        "ext.config.outdatedPrettiereVersion",
        "Outdated version of prettier detected. Upgrade to latest."
      ).replace("{{path}}", prettierPath || "unknown");
      window.showErrorMessage(message);
    }
  }
}

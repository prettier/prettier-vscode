import { TextEncoder } from "util";
import { Uri, workspace } from "vscode";
import { LoggingService } from "./LoggingService";
import { PrettierModule, PrettierOptions } from "./types";

export class TemplateService {
  constructor(
    private loggingService: LoggingService,
    private prettierModule: PrettierModule
  ) {}
  public async writeConfigFile(folderPath: Uri) {
    const settings = { tabWidth: 2, useTabs: false };

    const outputPath = Uri.joinPath(folderPath, ".prettierrc");

    const formatterOptions: PrettierOptions = {
      /* cspell: disable-next-line */
      filepath: outputPath.scheme === "file" ? outputPath.fsPath : undefined,
      tabWidth: settings.tabWidth,
      useTabs: settings.useTabs,
    };

    const templateSource = this.prettierModule.format(
      JSON.stringify(settings, null, 2),
      formatterOptions
    );

    this.loggingService.logInfo(`Writing .prettierrc to '${outputPath}'`);
    await workspace.fs.writeFile(
      outputPath,
      new TextEncoder().encode(templateSource)
    );
  }
}

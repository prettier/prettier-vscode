import { TextEncoder } from "util";
import { Uri, workspace } from "vscode";
import { LoggingService } from "./LoggingService";
import { PrettierModule, PrettierOptions } from "./types";
import { filterFormattingOptions, getConfig } from "./util";

export class TemplateService {
  constructor(
    private loggingService: LoggingService,
    private prettierModule: PrettierModule
  ) {}
  public async writeConfigFile(folderPath: Uri) {
    const vsCodeConfig = getConfig();
    const settings = {
      tabWidth: 2,
      useTabs: false,
      ...filterFormattingOptions(vsCodeConfig),
    };

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

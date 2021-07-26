import { format, Options } from "prettier";
import { Uri, workspace } from "vscode";
import { LoggingService } from "./LoggingService";

export class TemplateService {
  constructor(private loggingService: LoggingService) {}
  public async writeConfigFile(folderPath: Uri) {
    const settings = { tabWidth: 2, useTabs: false };

    const outputPath = Uri.joinPath(folderPath, `.prettierrc`);

    const formatterOptions: Options = {
      /* cspell: disable-next-line */
      filepath: outputPath.path,
      tabWidth: settings.tabWidth,
      useTabs: settings.useTabs,
    };

    const templateSource = format(
      JSON.stringify(settings, null, 2),
      formatterOptions
    );

    this.loggingService.logInfo(`Writing .prettierrc to '${outputPath}'`);
    const content = Buffer.from(templateSource, "utf-8");
    workspace.fs.writeFile(outputPath, content);
  }
}

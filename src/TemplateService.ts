import { writeFile } from "fs";
import * as path from "path";
import { format, Options } from "prettier";
import { promisify } from "util";
// tslint:disable-next-line: no-implicit-dependencies
import { Uri } from "vscode";
import { LoggingService } from "./LoggingService";

const writeFileAsync: (
  filePath: string,
  data: string,
  encoding: "utf8"
) => Promise<void> = promisify(writeFile);

export class TemplateService {
  constructor(private loggingService: LoggingService) {}
  public async writeConfigFile(folderPath: Uri, options?: Options) {
    const config = options || {
      tabWidth: 2,
      useTabs: false
    };

    const outputPath = path.join(folderPath.fsPath, ".prettierrc");

    const formatterOptions: Options = {
      filepath: outputPath,
      tabWidth: config.tabWidth,
      useTabs: config.useTabs
    };

    const templateSource = format(
      JSON.stringify(config, null, 2),
      formatterOptions
    );

    this.loggingService.appendLine(outputPath, "INFO");
    await writeFileAsync(outputPath, templateSource, "utf8");
  }
}

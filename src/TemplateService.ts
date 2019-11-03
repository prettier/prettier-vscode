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
  public async writeConfigFile(folderPath: Uri, options?: Map<string, any>) {
    const migratedOptions: { [key: string]: any } = {};
    if (options && options.size > 0) {
      options.forEach((value, key) => {
        migratedOptions[key] = value;
      });
    } else {
      // A simple default config
      migratedOptions.tabWidth = 2;
      migratedOptions.useTabs = false;
    }

    const outputPath = path.join(folderPath.fsPath, ".prettierrc");

    const formatterOptions: Options = {
      filepath: outputPath,
      tabWidth: migratedOptions.tabWidth,
      useTabs: migratedOptions.useTabs
    };

    const templateSource = format(
      JSON.stringify(migratedOptions, null, 2),
      formatterOptions
    );

    this.loggingService.logMessage(outputPath, "INFO");
    await writeFileAsync(outputPath, templateSource, "utf8");
  }
}

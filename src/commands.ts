import { window } from "vscode";
import { TemplateService } from "./TemplateService";

export type createConfigFileFunction = () => Promise<void>;

export const createConfigFile =
  (templateService: TemplateService): createConfigFileFunction =>
  async () => {
    const folderResult = await window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
    });
    if (folderResult && folderResult.length === 1) {
      const folderUri = folderResult[0];
      await templateService.writeConfigFile(folderUri);
    }
  };

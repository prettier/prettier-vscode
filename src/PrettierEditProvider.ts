import {
    workspace,
    DocumentRangeFormattingEditProvider,
    DocumentFormattingEditProvider,
    Range,
    TextDocument,
    FormattingOptions,
    CancellationToken,
    TextEdit
} from 'vscode';

const path = require('path');
const fs = require('fs');

const prettier = require('prettier');

interface PrettierConfig {
    onlyFormatWhenInstalled: boolean,
    printWidth: number,
    tabWidth: number,
    useFlowParser: boolean, // deprecated
    singleQuote: boolean,
    trailingComma: boolean,
    bracketSpacing: boolean,
    parser: string
}

function format(text: string): string {
    const config: PrettierConfig = workspace.getConfiguration('prettier') as any;
    /*
    handle deprecated parser option
    */
    let parser = config.parser;
    if (!parser) { // unset config
        parser = config.useFlowParser ? 'flow' : 'babylon';
    }
    let transformed: string;
    try {
        return prettier.format(text, {
            printWidth: config.printWidth,
            tabWidth: config.tabWidth,
            singleQuote: config.singleQuote,
            trailingComma: config.trailingComma,
            bracketSpacing: config.bracketSpacing,
            parser: parser
        });
    } catch (e) {
        console.log("Error transforming using prettier:", e.message);
        return text;
    }
}

function getPackageJson(fileName: string): any {
    const stats = fs.statSync(fileName);
    if (!stats.isDirectory()) return null;

    const packageJsonPath = path.join(fileName, 'package.json');
    if (!fs.existsSync(packageJsonPath)) return null;

    try {
        const packageJsonContents = fs.readFileSync(packageJsonPath, 'utf8');
        return JSON.parse(packageJsonContents);
    } catch (e) {
        return null;
    }
}

function isInstalledInProject(document: TextDocument): boolean {
    let currentDir = path.dirname(document.fileName);

    while (path.basename(currentDir) !== '') {
        const packageJson = getPackageJson(currentDir);

        if (packageJson) {
            const { devDependencies = {}, dependencies = {} } = packageJson;
            const isInstalled = ('prettier' in devDependencies) || ('prettier' in dependencies);
            return isInstalled;
        }

        currentDir = path.dirname(currentDir);
    }

    return true;
}

function shouldFormat(document: TextDocument): boolean {
    const config: PrettierConfig = workspace.getConfiguration('prettier') as any;

    return (config.onlyFormatWhenInstalled && !document.isUntitled)
        ? isInstalledInProject(document)
        : true;
}

function fullDocumentRange(document: TextDocument): Range {
    const lastLineId = document.lineCount - 1;
    return new Range(0, 0, lastLineId, document.lineAt(lastLineId).text.length);
}

class PrettierEditProvider implements
    DocumentRangeFormattingEditProvider,
    DocumentFormattingEditProvider {
    provideDocumentRangeFormattingEdits(
        document: TextDocument,
        range: Range,
        options: FormattingOptions,
        token: CancellationToken
    ): TextEdit[] {
        if (!shouldFormat(document)) return [];
        return [TextEdit.replace(range, format(document.getText(range)))];
    }
    provideDocumentFormattingEdits(
        document: TextDocument,
        options: FormattingOptions,
        token: CancellationToken
    ): TextEdit[] {
        if (!shouldFormat(document)) return [];
        return [TextEdit.replace(fullDocumentRange(document), format(document.getText()))];
    }
}

export default PrettierEditProvider;
export { PrettierConfig }
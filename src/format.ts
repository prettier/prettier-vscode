import { TextDocument } from 'vscode';

import { PrettierConfig } from './prettier.d';
import { PrettierEslint } from './prettier-eslint.d';
import { getExtensionConfig, getPrettierOptions, isESLintCompatibleParser } from './config';
import { exec } from './exec';

const prettier = require('../ext');

/**
 * Format document
 * 
 * @param text 
 * @param document 
 */
export function format(text: string, document: TextDocument): string {
	const prettierOptions = getPrettierOptions(document);

	if (!prettierOptions) {
		return text;
	}

	const formatter = getFormatter(text, document.fileName, prettierOptions);

	return exec(formatter, text, document);
}

/**
 * Get formatter based on config (prettier or prettier-eslint)
 * 
 * @param text 
 * @param fileName 
 * @param prettierOptions 
 */
function getFormatter(text: string, fileName: string, prettierOptions: PrettierConfig): () => string {
	const config = getExtensionConfig();

	if (config.eslintIntegration && isESLintCompatibleParser(prettierOptions.parser)) {
		const prettierEslint = require('prettier-eslint') as PrettierEslint;

		return prettierEslint.bind(null, {
			text,
			filePath: fileName,
			prettierOptions: prettierOptions
		});
	}

	return prettier.format.bind(null, text, prettierOptions);
}

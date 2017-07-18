import { PrettierVSCodeConfig } from './prettier.d';

/**
 * Select parser based on current file languageId
 * 
 * @param config 
 * @param languageId 
 */
export function selectParser(
    config: PrettierVSCodeConfig,
    languageId: string
): string | void {
    switch (true) {
        case config.javascriptEnable.includes(languageId):
            return 'babylon';
        case config.typescriptEnable.includes(languageId):
            return 'typescript';
        case config.cssEnable.includes(languageId):
            return 'postcss';
        case config.jsonEnable.includes(languageId):
            return 'json';
        case config.graphqlEnable.includes(languageId):
            return 'graphql';
    }
}

/**
 * @param string parser 
 */
export function isBabylonParser(parser: string): Boolean {
    return parser === 'babylon';
}

/**
 * Returns object with relevant properties from user VSCode config
 * for Prettier configuration
 * 
 * @param object config 
 */
export function extractUserVSConfig(config: PrettierVSCodeConfig): Object {
    return Object.keys(config).reduce((res, key) => {
        const item = config[key];

        if (
            typeof item === 'boolean' ||
            typeof item === 'string' ||
            typeof item === 'number'
        ) {
            res[key] = item;
        }

        return res;
    }, {});
}

const packageJson = require('../../package.json');

export const latestVersions = {
  electron: '^3.0.0',
  ['@electron-schematics/build-electron']: `^${packageJson.version}`,
  ['ts-loader']: '^5.2.1',
  ['copy-webpack-plugin']: '^4.5.2',
  ['@angular-builders/custom-webpack']: '^7.4.3',
};

const packageJson = require('../../package.json');

export const latestVersions = {
  electron: '^4.0.0',
  ['@electron-schematics/build-electron']: `^${packageJson.version}`,
  ['ts-loader']: '^5.2.1',
  ['copy-webpack-plugin']: '^4.5.2',
};

const packageJson = require('../../package.json');

export const latestVersions = {
  electron: '^3.0.0',
  ['electron-builder']: '^20.28.4',
  ['@electron-schematics/build-electron']: `^${packageJson.version}`,
  ['ts-loader']: '^5.2.1',
  ['copy-webpack-plugin']: '^4.5.2',
};

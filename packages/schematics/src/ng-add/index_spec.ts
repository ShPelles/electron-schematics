import * as path from 'path';
import { HostTree } from '@angular-devkit/schematics';
import { virtualFs } from '@angular-devkit/core';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';

import { Schema } from './schema';


const collectionPath = path.join(__dirname, '../../collection.json');

describe('ng-add', () => {

  // let host: virtualFs.test.TestHost;
  let appTree: UnitTestTree = new UnitTestTree(new HostTree());
  const runner = new SchematicTestRunner('schematics', collectionPath);

  beforeEach(() => {
    const host = new virtualFs.test.TestHost({
      '/angular.json': `
      {
        "newProjectRoot": "projects",
        "projects": {
          "foo": {},
          "bar": {}
        },
        "defaultProject": "foo"
      }
      `,
      '/package.json': `
      {
      }
      `,
    });
    appTree = new UnitTestTree(new HostTree(host));
  });

  it('should add the application to the workspace', async () => {
    const tree = await runner.runSchematicAsync('ng-add', {}, appTree).toPromise();

    const workspace = JSON.parse(tree.readContent('/angular.json'));
    expect(workspace.projects.electron).toBeDefined();
    expect(workspace.projects.electron.architect.serve.builder).toBe('@electron-schematics/build-electron:start');
    expect(workspace.projects.electron.architect.serve.options.browserTarget).toBe(`foo:serve`);
  });

  it('should use the right application', async () => {
    const opts: Schema = { relatedAppName: 'bar' };
    const tree = await runner.runSchematicAsync('ng-add', opts, appTree).toPromise();

    const workspace = JSON.parse(tree.readContent('/angular.json'));
    expect(workspace.projects.electron.architect.serve.options.browserTarget).toBe(`bar:serve`);
  });

  it('should create files', async () => {
    const tree = await runner.runSchematicAsync('ng-add', {}, appTree).toPromise();

    expect(tree.files.includes('/projects/electron/main.ts')).toBe(true);
    expect(tree.files.includes('/projects/electron/package.json')).toBe(true);
    expect(tree.files.includes('/projects/electron/tsconfig.electron.json')).toBe(true);
    expect(tree.files.includes('/projects/electron/webpack.config.js')).toBe(true);
  });

  it('should use the right project name', async () => {
    const opts: Schema = { name: 'shell' };
    const tree = await runner.runSchematicAsync('ng-add', opts, appTree).toPromise();

    const workspace = JSON.parse(tree.readContent('/angular.json'));
    expect(workspace.projects.shell).toBeDefined();
    expect(workspace.projects.electron).not.toBeDefined();

    expect(tree.files.includes('/projects/shell/main.ts')).toBe(true);
    expect(tree.files.includes('/projects/electron/main.ts')).toBe(false);
  });

  it('should add & install packages', async () => {
    const tree = await runner.runSchematicAsync('ng-add', {}, appTree).toPromise();

    const devPackages = ['electron', 'ts-loader', 'copy-webpack-plugin', '@electron-schematics/build-electron'];
    const packageJson = JSON.parse(tree.readContent('/package.json'));
    devPackages.forEach(pack =>
      expect(packageJson['devDependencies'][pack]).not.toBeUndefined()
    );

    // Check install task.
    expect(runner.tasks).toEqual([
      {
        name: 'node-package',
        options: jasmine.objectContaining({
          command: 'install',
        }),
      },
    ]);
  });

  it('should not insall packages when --skipInstall', async () => {
    const tree = await runner.runSchematicAsync('ng-add', { skipInstall: true }, appTree).toPromise();

    const devPackages = ['electron', 'ts-loader', 'copy-webpack-plugin', '@electron-schematics/build-electron'];
    const packageJson = JSON.parse(tree.readContent('/package.json'));
    devPackages.forEach(pack =>
      expect(packageJson['devDependencies'][pack]).not.toBeUndefined()
    );

    // Check install task.
    expect(runner.tasks).toEqual([]);
  });
});

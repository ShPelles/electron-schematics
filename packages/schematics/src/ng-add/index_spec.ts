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
          "foo": {
            "architect": {
              "build": {
                "builder": "@angular-devkit/build-angular:browser"
              }
            }
          },
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

  it('should add the application to the workspace', () => {
    const tree = runner.runSchematic('ng-add', {}, appTree);

    const workspace = JSON.parse(tree.readContent('/angular.json'));
    expect(workspace.projects.electron).toBeDefined();
    expect(workspace.projects.electron.architect.serve.builder).toBe('@electron-schematics/build-electron:start');
    expect(workspace.projects.electron.architect.serve.options.browserTarget).toBe(`foo:serve`);
  });

  it('should use the right application', () => {
    const opts: Schema = { relatedAppName: 'bar' };
    const tree = runner.runSchematic('ng-add', opts, appTree);

    const workspace = JSON.parse(tree.readContent('/angular.json'));
    expect(workspace.projects.electron.architect.serve.options.browserTarget).toBe(`bar:serve`);
  });

  it('should set a custom builder in the related app', () => {
    const tree = runner.runSchematic('ng-add', {}, appTree);

    const workspace = JSON.parse(tree.readContent('/angular.json'));
    expect(workspace.projects.foo.architect.build.builder).toBe('@angular-builders/custom-webpack:browser');
  });

  it('should create files', () => {
    const tree = runner.runSchematic('ng-add', {}, appTree);

    expect(tree.files.includes('/projects/electron/main.ts')).toBe(true);
    expect(tree.files.includes('/projects/electron/package.json')).toBe(true);
    expect(tree.files.includes('/projects/electron/tsconfig.electron.json')).toBe(true);
    expect(tree.files.includes('/projects/electron/webpack.config.js')).toBe(true);
  });

  it('should use the right project name', () => {
    const opts: Schema = { name: 'shell' };
    const tree = runner.runSchematic('ng-add', opts, appTree);

    const workspace = JSON.parse(tree.readContent('/angular.json'));
    expect(workspace.projects.shell).toBeDefined();
    expect(workspace.projects.electron).not.toBeDefined();

    expect(tree.files.includes('/projects/shell/main.ts')).toBe(true);
    expect(tree.files.includes('/projects/electron/main.ts')).toBe(false);
  });

  it('should add & install packages', () => {
    const tree = runner.runSchematic('ng-add', {}, appTree);

    const devPackages = [
      'electron', 'ts-loader', 'copy-webpack-plugin', '@electron-schematics/build-electron', '@angular-builders/custom-webpack'
    ];
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

  it('should not insall packages when --skipInstall', () => {
    const tree = runner.runSchematic('ng-add', { skipInstall: true }, appTree);

    const devPackages = ['electron', 'ts-loader', 'copy-webpack-plugin', '@electron-schematics/build-electron'];
    const packageJson = JSON.parse(tree.readContent('/package.json'));
    devPackages.forEach(pack =>
      expect(packageJson['devDependencies'][pack]).not.toBeUndefined()
    );

    // Check install task.
    expect(runner.tasks).toEqual([]);
  });
});

import { strings } from '@angular-devkit/core';
import {
  Rule,
  SchematicContext,
  Tree,
  apply,
  chain,
  mergeWith,
  move,
  template,
  url,
  SchematicsException,
} from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

import {
  getWorkspace, WorkspaceSchema, getWorkspacePath,
} from '@schematics/angular/utility/config';
import { validateProjectName } from '@schematics/angular/utility/validation';
import { NodeDependencyType, addPackageJsonDependency } from '@schematics/angular/utility/dependencies';

import { Schema as ElectronOptions } from './schema';
import { latestVersions } from '../utility/latest-versions';

function addDependenciesToPackageJson() {
  return (host: Tree) => {
    [
      {
        type: NodeDependencyType.Dev,
        name: 'electron',
        version: latestVersions.electron,
      },
      {
        type: NodeDependencyType.Dev,
        name: 'ts-loader',
        version: latestVersions['ts-loader'],
      },
      {
        type: NodeDependencyType.Dev,
        name: 'copy-webpack-plugin',
        version: latestVersions['copy-webpack-plugin'],
      },
      {
        type: NodeDependencyType.Dev,
        name: '@electron-schematics/build-electron',
        version: latestVersions['@electron-schematics/build-electron'],
      },
      {
        type: NodeDependencyType.Dev,
        name: '@angular-builders/custom-webpack',
        version: latestVersions['@angular-builders/custom-webpack'],
      },
    ].forEach(dependency => addPackageJsonDependency(host, dependency));
    return host;
  };
}
function installDependencies(options: ElectronOptions) {
  return (_host: Tree, context: SchematicContext) => {
    if (options.skipInstall) { return; }
    context.addTask(new NodePackageInstallTask());
  };
}


function addAppToWorkspaceFile(options: ElectronOptions, workspace: WorkspaceSchema): Rule {
  return (host: Tree, _context: SchematicContext) => {

    const projectRoot = `${workspace.newProjectRoot}/${options.name}/`;
    // tslint:disable-next-line:no-any
    const project: any = {
      root: projectRoot,
      projectType: 'application',
      architect: {
        build: {
          builder: '@electron-schematics/build-electron:build',
          options: {
            relatedApp: options.relatedAppName,
            webpackConfig: `${projectRoot}main.webpack.config.js`,
          },
        },
        serve: {
          builder: '@electron-schematics/build-electron:start',
          options: {
            browserTarget: `${options.relatedAppName}:serve`,
            webpackConfig: `${projectRoot}main.webpack.config.js`,
          },
          configurations: {
            dev: {
              browserTarget: `${options.relatedAppName}:serve:dev`
            },
            production: {
              browserTarget: `${options.relatedAppName}:serve:production`
            }
          }
        },
        lint: {
          builder: '@angular-devkit/build-angular:tslint',
          options: {
            tsConfig: `${projectRoot}tsconfig.electron.json`,
          },
        },
      },
    };

    if (options.name === undefined) { throw new SchematicsException('Name must have a value'); }
    workspace.projects[options.name] = project;

    if (options.relatedAppName === undefined) { throw new SchematicsException('relatedAppName must have a value'); }
    const relatedApp = workspace.projects[options.relatedAppName] || {};
    const architect = relatedApp.architect || {};
    const build = architect.build || {};
    build.builder = '@angular-builders/custom-webpack:browser';

    host.overwrite(getWorkspacePath(host), JSON.stringify(workspace, null, 2));
  };
}

export function electron(options: ElectronOptions): Rule {
  return (host: Tree, _context: SchematicContext) => {
    options.name = options.name || 'electron';
    validateProjectName(options.name);

    const workspace = getWorkspace(host);
    const newProjectRoot = workspace.newProjectRoot;
    const appDir = `${newProjectRoot}/${options.name}`;

    options.relatedAppName = options.relatedAppName || workspace.defaultProject;
    if (!options.relatedAppName) {
      throw new SchematicsException('Option "relatedAppName" is required.');
    }
    const relatedApp = workspace.projects[options.relatedAppName];
    if (!relatedApp) {
      throw new Error(`Related app is not defined in this workspace.`);
    }

    return chain([
      addAppToWorkspaceFile(options, workspace),
      mergeWith(
        apply(url('./files'), [
          template({
            utils: strings,
            ...options,
            appDir,
          }),
          move(appDir),
        ])),
      addDependenciesToPackageJson(),
      installDependencies(options),
    ]);

  };
}

import { BuilderContext, BuilderOutput, createBuilder, Target, BuilderProgressState } from '@angular-devkit/architect';
import { getSystemPath, json, normalize, resolve } from '@angular-devkit/core';
import { Schema as BrowserBuilderSchema } from '@angular-devkit/build-angular/src/browser/schema';
import { runWebpack } from '@angular-devkit/build-webpack';

import { Observable, of, from } from 'rxjs';
import { concatMap, first, mapTo, catchError, switchMap, tap } from 'rxjs/operators';
import * as webpack from 'webpack';

import { build } from 'electron-builder';
import { ElectronBuilderSchema } from './schema';

function _buildMain(
    options: ElectronBuilderSchema,
    context: BuilderContext,
): Observable<BuilderOutput> {
    const configPath = resolve(normalize(context.workspaceRoot), normalize(options.webpackConfig));

    return from(import(getSystemPath(configPath))).pipe(
        // For no reason I can fathom, a property called "default" is tacked on to this object by person or persons unknown.
        // If it is not deleted before we continue, bad things happen.
        tap((config: webpack.Configuration) => delete (config as any).default),
        switchMap((config: webpack.Configuration) => runWebpack(config, context)),
        first(),
    );
}

function _buildRenderer(
    options: ElectronBuilderSchema,
    context: BuilderContext,
): Observable<BuilderOutput> {

    const target = {
        project: options.relatedApp,
        target: 'build',
        configuration: context.target && context.target.configuration,
    } as Target;

    const overrides = {
        baseHref: './',
    } as Partial<BrowserBuilderSchema> & json.JsonObject;

    return from(context.scheduleTarget(target, overrides)).pipe(
        switchMap(builderRun => builderRun.result),
    );
}

function _packApp(
    options: ElectronBuilderSchema,
    context: BuilderContext,
): Observable<BuilderOutput> {
    // TODO: should be a better way to get the project root
    const project = context.target ? context.target.project : '';
    const projectRoot = `${context.workspaceRoot}/projects/${project}`;
    const electronBuilderJson = normalize(`${projectRoot}/electron-builder.json`);

    return of(null).pipe(
        switchMap(() => build({ config: getSystemPath(electronBuilderJson) })),
        mapTo({ success: true }),
        catchError(err => {
            context.logger.error('Failed to build the electron app', err);
            context.logger.error(err.toString());
            return of({ success: false });
        }),
    );
}

function buildElectron(
    options: ElectronBuilderSchema,
    context: BuilderContext,
): Observable<BuilderOutput> {
    return _buildMain(options, context).pipe(
        concatMap(() => _buildRenderer(options, context)),
        concatMap(() => _packApp(options, context)),
    );
}

export default createBuilder<json.JsonObject & ElectronBuilderSchema>(buildElectron);

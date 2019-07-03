import { BuilderContext, BuilderOutput, createBuilder, Target } from '@angular-devkit/architect';
import { getSystemPath, json, normalize, resolve } from '@angular-devkit/core';
import { Schema as BrowserBuilderSchema } from '@angular-devkit/build-angular/src/browser/schema';
import { runWebpack } from '@angular-devkit/build-webpack';

import { Observable, of, from } from 'rxjs';
import { concatMap, first, mapTo, catchError, switchMap } from 'rxjs/operators';
import * as webpack from 'webpack';

import { build } from 'electron-builder';
import { ElectronBuilderSchema } from './schema';

function _buildMain(
    options: ElectronBuilderSchema,
    context: BuilderContext,
): Observable<BuilderOutput> {
    const configPath = resolve(normalize(context.workspaceRoot), normalize(options.webpackConfig));

    return from(import(getSystemPath(configPath))).pipe(
        switchMap((config: webpack.Configuration) => runWebpack(config, context)),
        first(),
    );
}

async function _buildRenderer(
    options: ElectronBuilderSchema,
    context: BuilderContext,
): Promise<Observable<BuilderOutput>> {

    const target = {
        project: options.relatedApp,
        target: 'build',
        configuration: undefined,
    } as Target;

    const overrides = {
        baseHref: './',
    } as Partial<BrowserBuilderSchema> & json.JsonObject;

    const buildTargetRun = await context.scheduleTarget(target, overrides);
    return buildTargetRun.output;
}

function _packApp(
    options: ElectronBuilderSchema,
    context: BuilderContext,
): Observable<BuilderOutput> {
    return from(build({ config: context.workspaceRoot + 'electron-builder.json' })).pipe(
        mapTo({ success: true }),
        catchError(err => {
            context.logger.error('Failed to build the electron app', err);
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

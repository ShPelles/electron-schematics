import proc from 'child_process';
import kill from 'tree-kill';
import * as url from 'url';

import { BuilderContext, BuilderOutput, createBuilder, Target } from '@angular-devkit/architect';
import { normalize, getSystemPath, json, resolve } from '@angular-devkit/core';
import { runWebpack, runWebpackDevServer } from '@angular-devkit/build-webpack';

import { Observable, merge, TeardownLogic, from } from 'rxjs';
import { share, first, switchMap, dematerialize, materialize, tap, mapTo } from 'rxjs/operators';
import * as webpack from 'webpack';

import { ElectronStartBuilderSchema } from './schema';

async function startElectron(
    options: ElectronStartBuilderSchema,
    context: BuilderContext,
): Promise<BuilderOutput> {
    const { browserTarget, webpackConfig, electronParams, ...overrides } = options;
    const [project, target, configuration] = browserTarget.split(':');

    const builderRun = await context.scheduleTarget({ project, target, configuration }, overrides as json.JsonObject);
    const devServerObservable = builderRun.progress.pipe(
        mapTo({ success: false } as BuilderOutput),
        materialize(),
        share(),
    );
    const electronObservable = devServerObservable.pipe(
        first(),
        switchMap(() => _buildElectron(options, context)),
        switchMap(() => _runElectron(options, context).pipe(
            materialize(),
        )),
    );

    return merge(electronObservable, devServerObservable).pipe(
        dematerialize()
    ).toPromise();
}

function _buildElectron(
    options: ElectronStartBuilderSchema,
    context: BuilderContext,
): Observable<BuilderOutput> {
    const configPath = resolve(normalize(context.workspaceRoot), normalize(options.webpackConfig));

    return from(import(getSystemPath(configPath))).pipe(
        tap((config: webpack.Configuration) => config.watch = true),
        // For no reason I can fathom, a property called "default" is tacked on to this object by person or persons unknown.
        // If it is not deleted before we continue, bad things happen.
        tap((config: webpack.Configuration) => delete (config as any).default),
        switchMap(config => runWebpack(config, context)),
    );
}

function _runElectron(
    options: ElectronStartBuilderSchema,
    context: BuilderContext,
): Observable<BuilderOutput> {
    const project = context.target && context.target.project;
    const dist = `${context.workspaceRoot}/dist/${project}`;
    const projectRoot = getSystemPath(normalize(dist));

    const electronArgs = [projectRoot];
    const { electronParams } = options;
    if (electronParams) {
        electronArgs.unshift(...electronParams.split(' '));
    }

    const electron = require('electron');

    return new Observable((subscriber) => {
        const spawnOptions: proc.SpawnOptions = {
            stdio: ['pipe', 'inherit', 'inherit'],
            env: {
                ELECTRON_SERVE: 'true',
                ELECTRON_URL: _serveAddress(options)
            }
        };
        const child = proc.spawn(electron as any, electronArgs, spawnOptions);
        child.on('close', () => subscriber.complete());

        const teardown: TeardownLogic = () => kill(child.pid, 'SIGKILL');
        return teardown;
    });
}

function _serveAddress(options: ElectronStartBuilderSchema): string {
    // tslint:disable-next-line:max-line-length
    // copied from https://github.com/angular/angular-cli/blob/508d4df48231d4db11b690c55d51a57094a9e3ff/packages/angular_devkit/build_angular/src/dev-server/index.ts#L115

    // Resolve serve address.
    const serverAddress = url.format({
        protocol: options.ssl ? 'https' : 'http',
        hostname: options.host === '0.0.0.0' ? 'localhost' : options.host,
        // TODO: remove this:
        // tslint:disable-next-line: no-non-null-assertion
        port: options.port!.toString(),
    });
    return serverAddress;
}

export default createBuilder<json.JsonObject & ElectronStartBuilderSchema>(startElectron);

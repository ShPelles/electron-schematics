import proc from 'child_process';
import kill from 'tree-kill';
import * as url from 'url';

import {
    Builder,
    BuilderContext,
    BuilderConfiguration,
    BuildEvent
} from '@angular-devkit/architect';
import { normalize, getSystemPath } from '@angular-devkit/core';
import { WebpackBuilder } from '@angular-devkit/build-webpack';

import { Observable, of, merge, TeardownLogic } from 'rxjs';
import { concatMap, share, first, switchMap, dematerialize, materialize } from 'rxjs/operators';

import { ElectronStartBuilderSchema } from './schema';

export class ElectronStartBuilder implements Builder<ElectronStartBuilderSchema> {

    constructor(public context: BuilderContext) { }

    run(builderConfig: BuilderConfiguration<ElectronStartBuilderSchema>): Observable<BuildEvent> {
        const { browserTarget, webpackConfig, ...overrides } = builderConfig.options;
        const [project, target, configuration] = browserTarget.split(':');
        const devServerConfig = this.context.architect.getBuilderConfiguration(
            { project, target, configuration, overrides }
        );

        const devServerObservable = of(null).pipe(
            concatMap(() => this.context.architect.run(devServerConfig)),
            materialize(),
            share(),
        );
        const electronObservable = devServerObservable.pipe(
            first(),
            switchMap(() => this._buildElectron(builderConfig)),
            switchMap(() => this._runElectron(builderConfig).pipe(
                materialize(),
            )),
        );

        return merge(electronObservable, devServerObservable).pipe(
            dematerialize()
        );
    }

    private _buildElectron(builderConfig: BuilderConfiguration<ElectronStartBuilderSchema>): Observable<BuildEvent> {
        const webpackBuilder = new WebpackBuilder({ ...this.context });
        return webpackBuilder.run(builderConfig);
    }

    private _runElectron(builderConfig: BuilderConfiguration<ElectronStartBuilderSchema>): Observable<BuildEvent> {
        const [, project] = builderConfig.root.split('/');
        const dist = `${this.context.workspace.root}/dist/${project}`;
        const projectRoot = getSystemPath(normalize(dist));

        const electron = require('electron');

        return new Observable((subscriber) => {
            const options: proc.SpawnOptions = {
                stdio: ['pipe', 'inherit', 'inherit'],
                env: {
                    ELECTRON_SERVE: 'true',
                    ELECTRON_URL: this._serveAddress(builderConfig.options)
                }
            };
            const child = proc.spawn(electron, [projectRoot], options);
            child.on('close', () => subscriber.complete());

            const teardown: TeardownLogic = () => kill(child.pid, 'SIGKILL');
            return teardown;
        });
    }

    private _serveAddress(options: ElectronStartBuilderSchema): string {
        // tslint:disable-next-line:max-line-length
        // copied from https://github.com/angular/angular-cli/blob/508d4df48231d4db11b690c55d51a57094a9e3ff/packages/angular_devkit/build_angular/src/dev-server/index.ts#L115

        // Resolve serve address.
        const serverAddress = url.format({
            protocol: options.ssl ? 'https' : 'http',
            hostname: options.host === '0.0.0.0' ? 'localhost' : options.host,
            port: options.port.toString(),
        });
        return serverAddress;
    }
}

export default ElectronStartBuilder;

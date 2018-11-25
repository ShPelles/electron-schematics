import proc from 'child_process';
import kill from 'tree-kill';

import {
    Builder,
    BuilderContext,
    BuilderConfiguration,
    BuildEvent
} from '@angular-devkit/architect';
import { normalize, getSystemPath } from '@angular-devkit/core';

import { Observable, of, merge, TeardownLogic } from 'rxjs';
import { concatMap, share, first, switchMap, dematerialize, materialize } from 'rxjs/operators';

import { ElectronStartBuilderSchema } from './schema';
import { WebpackBuilder } from '@angular-devkit/build-webpack';
import { DevServerBuilderOptions } from '@angular-devkit/build-angular';

export class ElectronStartBuilder implements Builder<ElectronStartBuilderSchema> {

    constructor(public context: BuilderContext) { }

    run(builderConfig: BuilderConfiguration<ElectronStartBuilderSchema>): Observable<BuildEvent> {
        const { browserTarget, port } = builderConfig.options;
        const [project, target, configuration] = browserTarget.split(':');
        const devServerConfig = this.context.architect.getBuilderConfiguration<DevServerBuilderOptions>(
            { project, target, configuration, overrides: { port } }
        );

        const devServerObservable = of(null).pipe(
            concatMap(() => this.context.architect.getBuilderDescription(devServerConfig)),
            concatMap(desc => this.context.architect.validateBuilderOptions(devServerConfig, desc)),
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
        const electronArgs = [projectRoot, '--serve'];

        if (builderConfig.options.inspect) {
          electronArgs.push('--inspect');
        }

        return new Observable((subscriber) => {
            const child = proc.spawn(electron, electronArgs, {
              stdio: ['pipe', 'inherit', 'inherit']
            });
            child.on('close', () => subscriber.complete());

            const teardown: TeardownLogic = () => kill(child.pid);
            return teardown;
        });
    }

}

export default ElectronStartBuilder;

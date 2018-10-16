import proc from 'child_process';

import {
    Builder,
    BuilderContext,
    BuilderConfiguration,
    BuildEvent
} from '@angular-devkit/architect';
import { normalize, getSystemPath } from '@angular-devkit/core';

import { Observable, of, merge } from 'rxjs';
import { mapTo, concatMap, share, first, switchMap, dematerialize, materialize } from 'rxjs/operators';

import { ElectronStartBuilderSchema } from './schema';
import { WebpackBuilder } from '@angular-devkit/build-webpack';

export class ElectronStartBuilder implements Builder<ElectronStartBuilderSchema> {

    constructor(public context: BuilderContext) { }

    run(builderConfig: BuilderConfiguration<ElectronStartBuilderSchema>): Observable<BuildEvent> {
        const targetString = builderConfig.options.browserTarget;
        const [project, target, configuration] = targetString.split(':');
        const devServerConfig = this.context.architect.getBuilderConfiguration(
            { project, target, configuration }
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
        return webpackBuilder.run(builderConfig).pipe(
            mapTo({ success: true })
        );
    }

    private _runElectron(builderConfig: BuilderConfiguration<ElectronStartBuilderSchema>): Observable<BuildEvent> {
        const [, project] = builderConfig.root.split('/');
        const dist = `${this.context.workspace.root}/dist/${project}`;
        const projectRoot = getSystemPath(normalize(dist));

        const electron = require('electron');

        return new Observable((subscriber) => {
            const child = proc.spawn(electron, [projectRoot, '--serve']);
            child.on('close', () => subscriber.complete());
            return () => {
                child.kill();
            };
        });
    }

}

export default ElectronStartBuilder;

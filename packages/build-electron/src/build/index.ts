import {
    Builder,
    BuilderContext,
    BuilderConfiguration,
    BuildEvent
} from '@angular-devkit/architect';
import { BrowserBuilderSchema } from '@angular-devkit/build-angular';

import { Observable, of, from } from 'rxjs';
import { concatMap, first, mapTo, catchError } from 'rxjs/operators';
import { build } from 'electron-builder';

import { ElectronBuilderSchema } from './schema';
import { WebpackBuilder } from '@angular-devkit/build-webpack';
import { WebpackBuilderSchema } from '@angular-devkit/build-webpack/src/webpack/schema';


export class ElectronBuilder implements Builder<ElectronBuilderSchema> {

    constructor(public context: BuilderContext) { }

    run(builderConfig: BuilderConfiguration<ElectronBuilderSchema>): Observable<BuildEvent> {

        return this._buildMain(builderConfig).pipe(
            concatMap(() => this._buildRenderer(builderConfig)),
            concatMap(() => this._packApp(builderConfig)),
        );
    }

    private _buildMain(builderConfig: BuilderConfiguration<WebpackBuilderSchema>): Observable<BuildEvent> {
        const webpackBuilder = new WebpackBuilder({ ...this.context });
        return webpackBuilder.run(builderConfig).pipe(
            first(),
        );
    }

    private _buildRenderer(builderConfig: BuilderConfiguration<ElectronBuilderSchema>): Observable<BuildEvent> {
        const project = builderConfig.options.relatedApp;
        const target = 'build';
        const configuration = undefined;
        const buildConfig = this.context.architect.getBuilderConfiguration<BrowserBuilderSchema>(
            { project, target, configuration }
        );

        buildConfig.options.baseHref = './';

        return this.context.architect.run(buildConfig);
    }

    private _packApp(builderConfig: BuilderConfiguration<ElectronBuilderSchema>): Observable<BuildEvent> {
        return from(build({ config: builderConfig.root + 'electron-builder.json' })).pipe(
            mapTo({ success: true }),
            catchError(err => {
                this.context.logger.error('Failed to build the electron app', err);
                return of({ success: false });
            }),
        );
    }

}

export default ElectronBuilder;

import {
    Builder,
    BuilderContext,
    BuilderConfiguration,
    BuildEvent
} from '@angular-devkit/architect';
import { BrowserBuilderSchema } from '@angular-devkit/build-angular';

import { Observable, of } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { build } from 'electron-builder';

import { ElectronBuilderSchema } from './schema';


export class ElectronBuilder implements Builder<ElectronBuilderSchema> {

    constructor(public context: BuilderContext) { }

    run(builderConfig: BuilderConfiguration<ElectronBuilderSchema>): Observable<BuildEvent> {
        const project = builderConfig.options.relatedApp;
        const target = 'build';
        const configuration = undefined;
        const buildConfig = this.context.architect.getBuilderConfiguration<BrowserBuilderSchema>(
            { project, target, configuration }
        );

        buildConfig.options.baseHref = '';

        return of(null).pipe(
            concatMap(() => this.context.architect.getBuilderDescription(buildConfig)),
            concatMap(desc => this.context.architect.validateBuilderOptions(buildConfig, desc)),
            concatMap(() => this.context.architect.run(buildConfig)),

            concatMap(() => build({ config: builderConfig.root + 'electron-builder.json' })
                .then(x => ({ success: true }))
                .catch(err => {
                    this.context.logger.error('Failed to build the electron app', err);
                    return { success: false };
                }),
            )
        );
    }
}

export default ElectronBuilder;

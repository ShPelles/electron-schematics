import {
    Builder,
    BuilderContext,
    BuilderConfiguration,
    BuildEvent
} from '@angular-devkit/architect';
import { Observable, of } from 'rxjs';

import { ElectronBuilderSchema } from './schema';


export class ElectronBuilder implements Builder<ElectronBuilderSchema> {

    constructor(public context: BuilderContext) { }

    run(builderConfig: BuilderConfiguration<ElectronBuilderSchema>): Observable<BuildEvent> {
        this.context.logger.warn('Electron build is not implemented yet');
        return of({ success: false }).pipe(
        );
    }

}

export default ElectronBuilder;

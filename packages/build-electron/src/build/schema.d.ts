import { Schema as BrowserBuilderSchema } from '@angular-devkit/build-angular/src/browser/schema';
import { Schema as WebpackBuilderSchema } from '@angular-devkit/build-webpack/src/webpack/schema';

export interface ElectronBuilderSchema extends WebpackBuilderSchema, WebpackBuilderSchema {
    relatedApp: string;
}
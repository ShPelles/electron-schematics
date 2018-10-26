import { BrowserBuilderSchema } from "@angular-devkit/build-angular";
import { WebpackBuilderSchema } from "@angular-devkit/build-webpack/src/webpack/schema";

export interface ElectronBuilderSchema extends BrowserBuilderSchema, WebpackBuilderSchema  {
    relatedApp: string;
}
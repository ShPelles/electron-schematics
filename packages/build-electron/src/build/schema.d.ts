import { BrowserBuilderSchema } from "@angular-devkit/build-angular";

export interface ElectronBuilderSchema extends BrowserBuilderSchema  {
    relatedApp: string;
}
import { Schema as DevServerBuilderOptions,  } from '@angular-devkit/build-angular/src/dev-server/schema';
import { Schema as WebpackBuilderSchema } from '@angular-devkit/build-webpack/src/webpack/schema';

export interface ElectronStartBuilderSchema extends DevServerBuilderOptions, WebpackBuilderSchema {
    electronParams: string;
}

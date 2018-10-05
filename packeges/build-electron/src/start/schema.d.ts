import { DevServerBuilderOptions } from '@angular-devkit/build-angular';
import { WebpackBuilderSchema } from '@angular-devkit/build-webpack/src/webpack/schema';

export interface ElectronStartBuilderSchema extends DevServerBuilderOptions, WebpackBuilderSchema {

}

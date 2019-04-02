import { DevServerBuilderOptions } from '@angular-devkit/build-angular';
import { WebpackBuilderSchema } from '@angular-devkit/build-webpack/src/webpack/schema';
import { CustomWebpackSchema } from '@angular-builders/custom-webpack/typings/custom-webpack-schema';

export interface ElectronStartBuilderSchema extends DevServerBuilderOptions, WebpackBuilderSchema, CustomWebpackSchema {

}

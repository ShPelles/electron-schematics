import { WebpackBuilderSchema } from '@angular-devkit/build-webpack/src/webpack/schema';

export interface ElectronStartBuilderSchema extends WebpackBuilderSchema {
  browserTarget: string;
  port: number;
}

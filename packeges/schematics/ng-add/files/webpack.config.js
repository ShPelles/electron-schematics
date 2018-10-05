const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './<%= appDir %>/main.ts',
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    target: 'electron-main',
    mode: 'development',
    plugins: [
        new CopyWebpackPlugin(['projects/<%= name %>/package.json']),
    ],
    watch: true,
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, '../../dist/<%= name %>'),
    },
};
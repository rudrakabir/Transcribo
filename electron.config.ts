import type { Configuration } from 'webpack';
import path from 'path';

const config: Configuration = {
  entry: {
    main: './src/main/main.ts',
    preload: './src/preload.ts'
  },
  target: 'electron-main',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader'
        }
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  node: {
    __dirname: false,
    __filename: false
  }
};

export default config;
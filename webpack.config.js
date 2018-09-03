const path = require('path');
const webpack = require('webpack');
const fs = require('fs');

const nodeModules = {};
fs
  .readdirSync('node_modules')
  .filter(x => ['.bin'].indexOf(x) === -1)
  .forEach((mod) => {
    nodeModules[mod] = `commonjs ${mod}`;
  });

module.exports = {
  entry: './src',
  target: 'node',
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'server.js',
    // libraryTarget: 'this',
  },
  externals: nodeModules,
  plugins: [
    new webpack.BannerPlugin({
      banner: 'require("source-map-support").install();',
      raw: true,
      entryOnly: false,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  'env',
                  {
                    exclude: ['transform-regenerator'],
                    modules: false,
                  },
                ],
              ],
            },
          },
        ],
      },
    ],
  },
  stats: {
    colors: true,
  },
};

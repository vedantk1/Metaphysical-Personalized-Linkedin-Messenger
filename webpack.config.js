// const { set } = require('core-js/core/dict');
const path = require('path');

module.exports = {
    entry: {
        popup: './src/popup.js',
        settings: './src/settings.js',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js' // Will output popup.bundle.js and settings.bundle.js
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                      presets: [
                        ['@babel/preset-env', {
                          useBuiltIns: 'entry',
                          corejs: 3,
                          exclude: ['es.promise.with-resolvers']
                        }]
                      ],
                      plugins: [
                        ['babel-plugin-polyfill-corejs3', {
                          method: 'usage-global',
                          targets: '> 0.25%, not dead',
                          exclude: ['es.promise.with-resolvers']
                        }]
                      ]                   
                    }
                }
            }
        ]
    },
    resolve: {
        fallback: {
            "fs": false
        }
    }
};

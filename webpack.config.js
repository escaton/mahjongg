var path = require('path');

module.exports = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    entry: ['@babel/polyfill', './main.js'],
    output: {
        path: path.join(__dirname, 'build'),
        filename: 'bundle.js',
    },
    devServer: {
        host: '0.0.0.0',
        devMiddleware: {
            writeToDisk: true,
        },
        static: {
            directory: __dirname,
        },
    },
    module: {
        rules: [
            { test: /\.js$/, exclude: /node_modules/, use: 'babel-loader' },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            { test: /\.(jpg|gif)$/, type: 'asset/resource' },
        ],
    },
    devtool: 'source-map',
};

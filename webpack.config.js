const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const fs = require('fs');
const appDirectory = fs.realpathSync(process.cwd());
const resolvePath = relativePath => path.resolve(appDirectory, relativePath);


const outputDirectory = 'dist';

module.exports = {
    entry: {
        public: './src/client/index.js'
    },
    output: {
        path: path.join(__dirname, outputDirectory),
        chunkFilename: '[name].bundle.js',
        filename: '[name]bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
            },
            {
                test: /\.scss$/,
                include: resolvePath('./src/client'),
                loaders: [
                    require.resolve('style-loader'),
                    require.resolve('css-loader'),
                    require.resolve('sass-loader')
                ]
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.(png|woff|woff2|eot|ttf|svg)$/,
                loader: 'url-loader?limit=100000'
            }
        ]
    },
    devServer: {
        port: 3000,
        open: true,
        proxy: {
            '/api': {
                target: 'http://localhost:8080/',
                secure: false,
                changeOrigin: true
            }
        },
        historyApiFallback: true
    },
    optimization: {
        minimizer: [new UglifyJsPlugin()]
    },
    plugins: [
        new HtmlWebpackPlugin({
            inject: true,
            template: './src/public/index.html',
            favicon: './src/public/favicon.ico'
        })
    ]
};
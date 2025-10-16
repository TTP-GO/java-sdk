// ============================================
// FILE: webpack.config.js
// Build configuration for TTP Agent SDK
// ============================================

const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'agent-widget.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      name: 'TTPAgentSDK',
      type: 'umd',
      export: 'default',
    },
    globalObject: 'this',
    clean: true,
  },
  mode: 'development',
  devtool: 'source-map',
  
  // Module resolution
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  
  // Module rules
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: {
                  browsers: ['last 2 versions', 'ie >= 11']
                }
              }],
              ['@babel/preset-react', {
                runtime: 'automatic'
              }]
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  
  // External dependencies (for React components) - commented out for examples
  // externals: {
  //   'react': {
  //     commonjs: 'react',
  //     commonjs2: 'react',
  //     amd: 'react',
  //     root: 'React'
  //   },
  //   'react-dom': {
  //     commonjs: 'react-dom',
  //     commonjs2: 'react-dom',
  //     amd: 'react-dom',
  //     root: 'ReactDOM'
  //   }
  // },
  
  // Development server
  devServer: {
    static: [
      {
        directory: path.join(__dirname, 'examples'),
      },
      {
        directory: path.join(__dirname, 'dist'),
        publicPath: '/',
      }
    ],
    compress: true,
    port: 8080,
    open: true,
    hot: true,
    historyApiFallback: true,
  },
  
  // Plugins
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'index.html',
          to: 'index.html'
        },
        {
          from: 'examples',
          to: 'examples'
        }
      ]
    })
  ],

  // Optimization
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'all',
          filename: 'vendor.js',
        },
      },
    },
  },
};

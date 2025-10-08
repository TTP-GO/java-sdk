// ============================================
// FILE: webpack.config.js
// Build configuration
// ============================================

const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'agent-widget.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      name: 'VoiceAgentSDK',
      type: 'umd',
      export: 'default',
    },
    globalObject: 'this',
  },
  mode: 'development',
  devtool: 'source-map',
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
  },
};

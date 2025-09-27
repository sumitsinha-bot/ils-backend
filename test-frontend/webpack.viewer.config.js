const path = require('path');

module.exports = {
  entry: './viewer.js',
  output: {
    filename: 'viewer-bundle.js',
    path: path.resolve(__dirname, '.'),
  },
  mode: 'development',
  resolve: {
    fallback: {
      "buffer": false,
      "crypto": false,
      "events": false,
      "path": false,
      "stream": false,
      "string_decoder": false,
      "util": false
    }
  }
};
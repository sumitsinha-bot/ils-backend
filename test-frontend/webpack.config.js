const path = require('path');

module.exports = {
  entry: './app.js',
  output: {
    filename: 'bundle.js',
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
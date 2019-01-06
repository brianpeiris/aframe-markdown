const path = require("path");

module.exports = {
  output: {
    filename: "aframe-markdown.min.js"
  },
  devServer: {
    host: "0.0.0.0",
    publicPath: "/dist/"
  }
};

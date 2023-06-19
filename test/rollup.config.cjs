const nodeResolve = require("@rollup/plugin-node-resolve");

module.exports = {
   input: "tempBuild/App.js",
   output: {
      file: "appBundle.js",
      format: "iife"
   },
   plugins: [
      nodeResolve()
   ]
};

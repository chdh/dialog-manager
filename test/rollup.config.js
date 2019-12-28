import resolve from "rollup-plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import alias from "@rollup/plugin-alias";
import cleanup from "rollup-plugin-cleanup";

export default {
   input: "tempBuild/App.js",
   output: {
      file: "appBundle.js",
      format: "iife"
   },
   plugins: [
      resolve(),
      commonjs({
         namedExports: { "node_modules/es6-promise/dist/es6-promise.js": ["polyfill"] }
      }),
      alias({
         entries: {
            "dialog-manager": "../dist/DialogMgr.js"
         }
      }),
      cleanup()
   ]
};

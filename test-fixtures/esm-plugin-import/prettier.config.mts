// ESM TypeScript config with plugin import - requires Prettier 3.5.0+
import * as prettierPluginOxc from "@prettier/plugin-oxc";

export default {
  parser: "oxc-ts",
  plugins: [prettierPluginOxc],
};

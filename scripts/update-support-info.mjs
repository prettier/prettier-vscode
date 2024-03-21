/* eslint-disable */
import { writeFile } from "fs/promises";
import { format, getSupportInfo } from "prettier";
const result = await getSupportInfo();

const code = `export const supportInfo = ${JSON.stringify({ languages: result.languages }, null, 2)};`;
const formatted = await format(code, { parser: "typescript" });

await writeFile(
  new URL("../src/BrowserModuleResolver.SupportInfo.ts", import.meta.url)
    .pathname,
  formatted,
  "utf-8",
);

console.log(result.options);

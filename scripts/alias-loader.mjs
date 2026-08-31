import { existsSync } from "node:fs";
import { resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SOURCE_DIRECTORY = resolvePath(fileURLToPath(new URL("../src", import.meta.url)));
const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

export function resolve(specifier, context, nextResolve) {
  if (!specifier.startsWith("@/")) return nextResolve(specifier, context);

  const sourcePath = resolvePath(SOURCE_DIRECTORY, specifier.slice(2));
  const filePath = EXTENSIONS.map((extension) => `${sourcePath}${extension}`).find(existsSync);

  if (!filePath) return nextResolve(specifier, context);

  return { shortCircuit: true, url: pathToFileURL(filePath).href };
}

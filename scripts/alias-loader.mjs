import { existsSync } from "node:fs";
import { extname, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SOURCE_DIRECTORY = resolvePath(fileURLToPath(new URL("../src", import.meta.url)));
const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

const findFile = (path) => EXTENSIONS.map((extension) => `${path}${extension}`).find(existsSync);

// 번들러처럼 `@/` 별칭과 확장자 없는 상대 경로를 TS 파일로 이어 준다. 소스는 테스트 때문에 import 형식을 바꿀 필요가 없다.
export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const filePath = findFile(resolvePath(SOURCE_DIRECTORY, specifier.slice(2)));
    if (filePath) return { shortCircuit: true, url: pathToFileURL(filePath).href };
  } else if (/^\.\.?\//.test(specifier) && !extname(specifier) && context.parentURL?.startsWith("file:")) {
    const filePath = findFile(resolvePath(fileURLToPath(new URL(".", context.parentURL)), specifier));
    if (filePath) return { shortCircuit: true, url: pathToFileURL(filePath).href };
  }

  return nextResolve(specifier, context);
}

import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { XMLParser } from "fast-xml-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Convert a Sublime Text snippet (XML) into a VS Code snippet definition (JSON).
 * @param {string} inputPath - Absolute path to the Sublime snippet file.
 * @param {string} outputPath - Absolute path for the resulting VS Code snippet file.
 * @returns {string} path
 */
export function convertSublimeToVsCode(inputPath, outputPath) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Sublime snippet file not found: ${inputPath}`);
  }

  const rawXml = fs.readFileSync(inputPath, "utf8");
  const xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });

  const parsed = xmlParser.parse(rawXml);

  if (!parsed || !parsed.snippet) {
    throw new Error("Invalid Sublime snippet format: <snippet> root element missing.");
  }

  const { content = "", tabTrigger, description } = parsed.snippet;

  if (!tabTrigger) {
    throw new Error("Sublime snippet missing <tabTrigger>; cannot determine prefix.");
  }

  const snippetBody = (typeof content === "string" ? content : content["#text"] || "")
    .replace(/^<!\[CDATA\[(.*)\]\]>$/s, "$1")
    .split("\n");

  const vscodeSnippet = {
    "Converted Snippet": {
      prefix: tabTrigger,
      body: snippetBody,
      description: description || "Converted from Sublime snippet",
    },
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(vscodeSnippet, null, 2)}\n`, "utf8");
  return outputPath;
}

if (process.argv[1]) {
  const entryUrl = pathToFileURL(process.argv[1]).href;
  if (import.meta.url === entryUrl) {
    const inputFilePath = path.resolve(__dirname, "input", "sample.sublime-snippet");
    const outputFilePath = path.resolve(
      __dirname,
      "output",
      "converted.code-snippets.json"
    );

    try {
      convertSublimeToVsCode(inputFilePath, outputFilePath);
      console.log(`Converted Sublime snippet to VS Code snippet: ${outputFilePath}`);
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
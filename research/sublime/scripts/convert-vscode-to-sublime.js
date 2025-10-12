import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { XMLBuilder } from "fast-xml-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Convert a VS Code snippet definition (JSON) into a Sublime Text snippet (XML).
 * @param {string} inputPath - Absolute path to the VS Code snippet JSON file.
 * @param {string} outputPath - Absolute path for the resulting Sublime snippet file.
 * @returns {string} output path
 */
export function convertVsCodeToSublime(inputPath, outputPath) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`VS Code snippet file not found: ${inputPath}`);
  }

  const rawJson = fs.readFileSync(inputPath, "utf8");
  const snippetDefinitions = JSON.parse(rawJson);
  const snippetName = Object.keys(snippetDefinitions)[0];

  if (!snippetName) {
    throw new Error("No VS Code snippets found in the provided file.");
  }

  const snippet = snippetDefinitions[snippetName];
  const prefix = Array.isArray(snippet.prefix) ? snippet.prefix[0] : snippet.prefix;

  if (!prefix) {
    throw new Error(`Snippet "${snippetName}" missing prefix; cannot determine <tabTrigger> value.`);
  }

  const bodyLines = Array.isArray(snippet.body) ? snippet.body.join("\n") : snippet.body;

  if (!bodyLines) {
    throw new Error(`Snippet "${snippetName}" missing body content.`);
  }

  const sublimeSnippet = {
    snippet: {
      content: {
        "#text": `<![CDATA[${bodyLines}]]>`,
      },
      tabTrigger: prefix,
    },
  };

  if (snippet.description) {
    sublimeSnippet.snippet.description = snippet.description;
  }

  const xmlBuilder = new XMLBuilder({
    ignoreAttributes: false,
    format: true,
    suppressBooleanAttributes: false,
  });

  const xmlOutput = xmlBuilder.build(sublimeSnippet);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${xmlOutput.trim()}\n`, "utf8");
  return outputPath;
}

if (process.argv[1]) {
  const entryUrl = pathToFileURL(process.argv[1]).href;
  if (import.meta.url === entryUrl) {
    const inputFilePath = path.resolve(__dirname, "input", "sample.code-snippets.json");
    const outputFilePath = path.resolve(
      __dirname,
      "output",
      "converted.sublime-snippet"
    );

    try {
      convertVsCodeToSublime(inputFilePath, outputFilePath);
      console.log(`Converted VS Code snippet to Sublime snippet: ${outputFilePath}`);
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
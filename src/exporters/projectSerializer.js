export function serializeProject(canvasData) {
  return JSON.stringify(canvasData, null, 2);
}

export function importProject(jsonString) {
  return JSON.parse(jsonString);
}

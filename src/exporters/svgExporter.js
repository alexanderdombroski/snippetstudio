export async function exportToSVG(svgElement) {
  const serializer = new XMLSerializer();
  const svgBlob = new Blob([serializer.serializeToString(svgElement)], {
    type: "image/svg+xml"
  });
  const url = URL.createObjectURL(svgBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "project.svg";
  link.click();
}

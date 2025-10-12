export async function exportToPNG(canvas) {
  const dataURL = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = "project.png";
  link.click();
}

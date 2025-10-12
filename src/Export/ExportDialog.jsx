import React, { useState } from "react";
import { Button, Dialog } from "@mui/material"; // or your UI lib

export default function ExportDialog({ open, onClose, onExport }) {
  const [format, setFormat] = useState("png");

  const handleExport = () => {
    onExport(format);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <div style={{ padding: 20 }}>
        <h3>Export Project</h3>
        <select value={format} onChange={e => setFormat(e.target.value)}>
          <option value="png">PNG</option>
          <option value="svg">SVG</option>
          <option value="pdf">PDF</option>
          <option value="json">Project File (.json)</option>
        </select>
        <div style={{ marginTop: 10 }}>
          <Button onClick={handleExport}>Export</Button>
        </div>
      </div>
    </Dialog>
  );
}

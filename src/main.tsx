import React from "react";
import RenderTable from "./RenderTable";
import { createRoot } from "react-dom/client";
import PreviewTable from "./PreviewTable";

function App() {
  const [selectedRow, setSelectedRow] = React.useState<number>(0);
  const [selectedColumn, setSelectedColumn] = React.useState<number>(0);

  const onChangeRowAndColumn = (row: number, column: number) => {
    setSelectedRow(row);
    setSelectedColumn(column);
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
      }}
    >
      <PreviewTable
        row={10}
        column={10}
        onChangeRowAndColumn={onChangeRowAndColumn}
      />
      <div style={{ width: "80%" }}>
        <RenderTable
          selectedRow={selectedRow}
          selectedColumn={selectedColumn}
        />
      </div>
    </div>
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

createRoot(rootElement).render(<App />);

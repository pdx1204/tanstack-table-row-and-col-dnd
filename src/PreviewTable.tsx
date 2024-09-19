import React from "react";

export default function PreviewTable({
  row,
  column,
  onChangeRowAndColumn,
}: {
  row: number;
  column: number;
  onChangeRowAndColumn: (row: number, column: number) => void;
}) {
  const { rowArray, columnArray } = React.useMemo(() => {
    const rowArray = Array.from({ length: row }, (_, i) => i);
    const columnArray = Array.from({ length: column }, (_, i) => i);
    return { rowArray, columnArray };
  }, [row, column]);

  const [hoveredRow, setHoveredRow] = React.useState<number>(0);
  const [hoveredColumn, setHoveredColumn] = React.useState<number>(0);

  return (
    <div
      className="preview-table"
      onMouseOut={() => {
        setHoveredRow(0);
        setHoveredColumn(0);
      }}
    >
      {rowArray.map((r) => (
        <div key={r} className="preview-row" style={{ display: "flex" }}>
          {columnArray.map((c) => (
            <div
              key={c}
              className="preview-cell"
              style={{
                border: "1px solid #797979",
                margin: "1px",
                width: "25px",
                height: "25px",
                cursor: "pointer",
                transition: "background-color 0.3s",
                backgroundColor:
                  hoveredRow > r && hoveredColumn > c ? "red" : "white",
              }}
              onMouseOver={() => {
                console.log(`row: ${r}, column: ${c}`);
                setHoveredRow(r + 1);
                setHoveredColumn(c + 1);
              }}
              onClick={() => {
                console.log(`row: ${r}, column: ${c}`);
                onChangeRowAndColumn(r + 1, c + 1);
              }}
            ></div>
          ))}
        </div>
      ))}
    </div>
  );
}

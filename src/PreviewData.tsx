import { Column, TableData } from "./makeData";

export default function PreviewData({
  data,
  columns,
}: {
  data: TableData[];
  columns: Column[];
}) {
  console.log(data, "PreviewData");

  return (
    <div>
      <pre style={{ height: "600px", overflow: "hidden auto" }}>
        {JSON.stringify(data, null, 2)}
      </pre>
      <pre style={{ height: "600px", overflow: "hidden auto" }}>
        {JSON.stringify(columns, null, 2)}
      </pre>
    </div>
  );
}

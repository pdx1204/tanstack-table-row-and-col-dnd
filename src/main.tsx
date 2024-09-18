import React, { CSSProperties } from "react";
import ReactDOM from "react-dom/client";

import "./index.css";

import {
  Cell,
  ColumnDef,
  Header,
  Row,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { makeData, Person } from "./makeData";

// needed for table body level scope DnD setup
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  restrictToHorizontalAxis,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

// needed for row & cell level scope DnD setup
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const RowDragHandle = ({ rowId }: { rowId: string }) => {
  const { transform, transition, isDragging, attributes, listeners } =
    useSortable({
      id: rowId,
    });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform), //let dnd-kit do its thing
    transition: transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : 0,
    position: "relative",
  };
  return (
    // Alternatively, you could set these attributes on the rows themselves
    <button {...attributes} {...listeners} style={style}>
      🟰
    </button>
  );
};

const ColDragHandle = ({ header }: { header: Header<Person, unknown> }) => {
  console.log(header, "header-1");

  const { attributes, isDragging, listeners, transform } =
    useSortable({
      id: header.column.id,
    });

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: "relative",
    transform: CSS.Translate.toString(transform), // translate instead of transform to avoid squishing
    transition: "width transform 0.2s ease-in-out",
    whiteSpace: "nowrap",
    width: header.column.getSize(),
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <button {...attributes} {...listeners} style={style}>
      🟰
    </button>
  );
};

// Row Component
const RenderRow = ({
  row,
  columnOrder,
}: {
  row: Row<Person>;
  columnOrder: string[];
}) => {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.userId,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform), //let dnd-kit do its thing
    transition: transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : 0,
    position: "relative",
  };
  return (
    // connect row ref to dnd-kit, apply important styles
    <tr ref={setNodeRef} style={style}>
      {row.getVisibleCells().map((cell) => (
        <SortableContext
          items={columnOrder}
          strategy={horizontalListSortingStrategy}
        >
          <RenderCol key={cell.column.id} cell={cell} />
        </SortableContext>
      ))}
    </tr>
  );
};

const RenderCol = ({ cell }: { cell: Cell<Person, unknown> }) => {
  console.log(cell, "cell-1");
  
  const { isDragging, setNodeRef, transform } = useSortable({
    id: cell.column.id,
  });

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: "relative",
    transform: CSS.Translate.toString(transform), // translate instead of transform to avoid squishing
    transition: "width transform 0.2s ease-in-out",
    width: cell.column.getSize(),
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <td style={style} ref={setNodeRef}>
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </td>
  );
};

function App() {
  const columns = React.useMemo<ColumnDef<Person>[]>(
    () => [
      // Create a dedicated drag handle column. Alternatively, you could just set up dnd events on the rows themselves.
      {
        accessorKey: "firstName",
        id: "firstName",
        cell: (info) => info.getValue(),
      },
      {
        accessorFn: (row) => row.lastName,
        id: "lastName",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "age",
        id: "age",
      },
      {
        accessorKey: "visits",
        id: "visits",
      },
      {
        accessorKey: "status",
        id: "status",
      },
      {
        accessorKey: "progress",
        id: "progress",
      },
    ],
    []
  );
  const [data, setData] = React.useState(() => makeData(20));

  const rowIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ userId }) => userId),
    [data]
  );
  const [columnOrder, setColumnOrder] = React.useState<string[]>(() =>
    columns.map((c) => c.id!)
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.userId, //required because row indexes will change
    state: {
      columnOrder,
    },
    onColumnOrderChange: setColumnOrder,
    debugTable: true,
    debugHeaders: true,
    debugColumns: true,
  });

  // reorder rows after drag & drop
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (columnHover) {
      if (active && over && active.id !== over.id) {
        setColumnOrder((columnOrder) => {
          const oldIndex = columnOrder.indexOf(active.id as string);
          const newIndex = columnOrder.indexOf(over.id as string);
          return arrayMove(columnOrder, oldIndex, newIndex); //this is just a splice util
        });
      }
    } else {
      if (active && over && active.id !== over.id) {
        setData((data) => {
          const oldIndex = rowIds.indexOf(active.id);
          const newIndex = rowIds.indexOf(over.id);
          return arrayMove(data, oldIndex, newIndex); //this is just a splice util
        });
      }
    }
  }

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const [columnHover, setColumnHover] = React.useState(false);

  return (
    // NOTE: This provider creates div elements, so don't nest inside of <table> elements
    <DndContext
      collisionDetection={closestCenter}
      modifiers={[
        columnHover ? restrictToHorizontalAxis : restrictToVerticalAxis,
      ]}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <div className="p-2">
        {table.getHeaderGroups().map((headerGroup) => (
          <div
            key={headerGroup.id}
            style={{ display: "flex", marginLeft: "26px" }}
          >
            <SortableContext
              items={columnOrder}
              strategy={horizontalListSortingStrategy}
            >
              {headerGroup.headers.map((header) => (
                <div
                  key={header.id}
                  style={{
                    backgroundColor: "red",
                  }}
                  onMouseEnter={() => {
                    setColumnHover(true);
                  }}
                >
                  <ColDragHandle header={header} />
                </div>
              ))}
            </SortableContext>
          </div>
        ))}
        <div style={{ display: "flex" }}>
          <div>
            <SortableContext
              items={rowIds}
              strategy={verticalListSortingStrategy}
            >
              {table.getRowModel().rows.map((row) => (
                <div
                  key={row.id}
                  style={{
                    width: "26px",
                    height: "26px",
                    textAlign: "center",
                    lineHeight: "26px",
                    backgroundColor: "red",
                  }}
                  onMouseEnter={() => {
                    setColumnHover(false);
                  }}
                >
                  <RowDragHandle rowId={row.id} />
                </div>
              ))}
            </SortableContext>
          </div>
          <table>
            <tbody>
              <SortableContext
                items={columnHover ? columnOrder : rowIds}
                strategy={
                  columnHover
                    ? horizontalListSortingStrategy
                    : verticalListSortingStrategy
                }
              >
                {table.getRowModel().rows.map((row) => (
                  <RenderRow key={row.id} row={row} columnOrder={columnOrder} />
                ))}
              </SortableContext>
            </tbody>
          </table>
        </div>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    </DndContext>
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

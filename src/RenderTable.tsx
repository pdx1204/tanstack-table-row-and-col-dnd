import React, {
  createContext,
  CSSProperties,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";

import "./index.css";

import {
  Cell,
  Header,
  Row,
  Table,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Column, generateData, TableData } from "./makeData";

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
import { useSize } from "ahooks";
import { faker } from "@faker-js/faker";

const RenderTableContent = createContext<{
  size: any;
  table: Table<TableData>;
}>(null!);

export default React.memo(function RenderTable(props: {
  selectedRow: number;
  selectedColumn: number;
}) {
  const { selectedRow, selectedColumn } = props;

  const [data, setData] = React.useState<TableData[]>([]);

  // 提供给 dnd-kit 的 columnOrder
  const [columnOrder, setColumnOrder] = React.useState<string[]>([]);

  const { columns } = React.useMemo<{
    columns: Column[];
  }>(() => {
    const { columns, data } = generateData(selectedRow, selectedColumn);

    setData(data);

    const columnsId = columns.map((c) => c.id);
    setColumnOrder?.(columnsId);

    return { columns };
  }, [selectedRow, selectedColumn]);

  const rowIds: UniqueIdentifier[] = useMemo(
    () => data.map((d) => d.uuid),
    [data]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.uuid, // required because row indexes will change
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

  const onEnterRow = () => {
    setColumnHover(false);
  };
  const onEnterColumn = () => {
    setColumnHover(true);
  };

  const renderTableClass = useMemo(
    () => "render-table" + faker.string.uuid(),
    []
  );

  const size = useSize(document.querySelector(`.${renderTableClass} td`));

  return (
    // NOTE: This provider creates div elements, so don't nest inside of <table> elements
    <RenderTableContent.Provider value={{ size, table }}>
      <div className={`render-table ${renderTableClass}`}>
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[
            columnHover ? restrictToHorizontalAxis : restrictToVerticalAxis,
          ]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <ColumnsDragHandle
            columnOrder={columnOrder}
            onEnterColumn={onEnterColumn}
          />
          <div style={{ display: "flex" }}>
            <RowsDragHandle rowIds={rowIds} onEnterRow={onEnterRow} />
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
                    <RenderRow
                      key={row.id}
                      row={row}
                      columnOrder={columnOrder}
                    />
                  ))}
                </SortableContext>
              </tbody>
            </table>
          </div>
        </DndContext>
      </div>
    </RenderTableContent.Provider>
  );
});

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
    <div {...attributes} {...listeners} style={style}>
      🟰
    </div>
  );
};

const ColumnDragHandle = ({
  columnId,
  header,
}: {
  columnId: string;
  header: Header<TableData, unknown>;
}) => {
  const { attributes, isDragging, listeners, transform } = useSortable({
    id: columnId,
  });

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform), // translate instead of transform to avoid squishing
    transition: "width transform 0.2s ease-in-out",
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : 0,
    position: "relative",
  };

  return (
    <div {...attributes} {...listeners} style={style}>
      🟰
    </div>
  );
};

const RowsDragHandle = ({
  rowIds,
  onEnterRow,
}: {
  rowIds: UniqueIdentifier[];
  onEnterRow: () => void;
}) => {
  const { table, size } = useContext(RenderTableContent);

  return (
    <div style={{ marginRight: "5px" }}>
      <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
        {table.getRowModel().rows.map((row) => (
          <div
            key={row.id}
            style={{
              width: "26px",
              height: size?.height,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "red",
            }}
            onMouseEnter={onEnterRow}
          >
            <RowDragHandle rowId={row.id} />
          </div>
        ))}
      </SortableContext>
    </div>
  );
};

const ColumnsDragHandle = ({
  columnOrder,
  onEnterColumn,
}: {
  columnOrder: string[];
  onEnterColumn: () => void;
}) => {
  const { table, size } = useContext(RenderTableContent);
  return (
    <>
      {table.getHeaderGroups().map((headerGroup) => (
        <div
          key={headerGroup.id}
          style={{ display: "flex", marginLeft: "31px", marginBottom: "5px" }}
        >
          <SortableContext
            items={columnOrder}
            strategy={horizontalListSortingStrategy}
          >
            {headerGroup.headers.map((header) => (
              <div
                key={header.id}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  textAlign: "center",
                  backgroundColor: "red",
                  width: size?.width,
                }}
                onMouseEnter={onEnterColumn}
              >
                <ColumnDragHandle columnId={header.column.id} header={header} />
              </div>
            ))}
          </SortableContext>
        </div>
      ))}
    </>
  );
};

// Row Component
const RenderRow = ({
  row,
  columnOrder,
}: {
  row: Row<TableData>;
  columnOrder: string[];
}) => {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.uuid,
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
          <RenderCell key={cell.column.id} cell={cell} />
        </SortableContext>
      ))}
    </tr>
  );
};

const RenderCell = ({ cell }: { cell: Cell<TableData, unknown> }) => {
  const { isDragging, setNodeRef, transform } = useSortable({
    id: cell.column.id,
  });

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: "relative",
    transform: CSS.Translate.toString(transform), // translate instead of transform to avoid squishing
    transition: "width transform 0.2s ease-in-out",
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <td style={style} ref={setNodeRef}>
      <div>{flexRender(cell.column.columnDef.cell, cell.getContext())}</div>
    </td>
  );
};

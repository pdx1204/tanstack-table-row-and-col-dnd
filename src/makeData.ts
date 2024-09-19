import { faker } from "@faker-js/faker";

export type Person = {
  uuid: string;
  userId: string;
  firstName: string;
  lastName: string;
  age: number;
  visits: number;
  progress: number;
  status: "relationship" | "complicated" | "single";
  subRows?: Person[];
};

const range = (len: number) => {
  const arr: number[] = [];
  for (let i = 0; i < len; i++) {
    arr.push(i);
  }
  return arr;
};

const newPerson = (): Person => {
  return {
    uuid: faker.string.uuid(),
    userId: faker.string.uuid(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    age: faker.number.int(40),
    visits: faker.number.int(1000),
    progress: faker.number.int(100),
    status: faker.helpers.shuffle<Person["status"]>([
      "relationship",
      "complicated",
      "single",
    ])[0]!,
  };
};

export function makeData(...lens: number[]) {
  const makeDataLevel = (depth = 0): Person[] => {
    const len = lens[depth]!;
    return range(len).map((_d): Person => {
      return {
        ...newPerson(),
        subRows: lens[depth + 1] ? makeDataLevel(depth + 1) : undefined,
      };
    });
  };

  return makeDataLevel();
}

export type TableData = {
  uuid: string;
  [key: string]: any;
};
export type Column = {
  accessorKey: string;
  id: string;
};

export const generateData = (row: number, column: number) => {
  console.log("generateData", row, column);
  
  const columns: Column[] = Array.from({ length: column }).map((_, i) => ({
    accessorKey: faker.string.uuid().substring(0, 8),
    id: faker.string.uuid().substring(0, 8),
  }));
  const data: TableData[] = Array.from({ length: row }).map((_, i) => {
    const row: TableData = { uuid: faker.string.uuid() };
    columns.forEach((column) => {
      row[column.accessorKey] = faker.date.weekday();
    });
    return row;
  });
  return { columns, data };
};

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DataTable } from "./data-table";

interface TestRow {
  id: string;
  name: string;
  value: number;
}

const testData: TestRow[] = [
  { id: "1", name: "Alpha", value: 100 },
  { id: "2", name: "Beta", value: 200 },
  { id: "3", name: "Gamma", value: 300 },
];

const columns = [
  { id: "name", header: "Name", cell: (row: TestRow) => row.name },
  { id: "value", header: "Value", cell: (row: TestRow) => row.value },
];

describe("DataTable", () => {
  it("renders table headers and data", () => {
    render(<DataTable data={testData} columns={columns} getRowId={(r) => r.id} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Value")).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("300")).toBeInTheDocument();
  });

  it("shows empty message when no data", () => {
    render(<DataTable data={[]} columns={columns} getRowId={(r: TestRow) => r.id} emptyMessage="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("supports row selection", () => {
    const onSelectionChange = vi.fn();
    render(
      <DataTable
        data={testData}
        columns={columns}
        getRowId={(r) => r.id}
        selectable
        selectedIds={new Set()}
        onSelectionChange={onSelectionChange}
      />
    );
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(4); // 1 header + 3 rows
    fireEvent.click(checkboxes[1]);
    expect(onSelectionChange).toHaveBeenCalled();
  });

  it("supports select all", () => {
    const onSelectionChange = vi.fn();
    render(
      <DataTable
        data={testData}
        columns={columns}
        getRowId={(r) => r.id}
        selectable
        selectedIds={new Set()}
        onSelectionChange={onSelectionChange}
      />
    );
    const selectAll = screen.getAllByRole("checkbox")[0];
    fireEvent.click(selectAll);
    expect(onSelectionChange).toHaveBeenCalled();
    const passedSet = onSelectionChange.mock.calls[0][0];
    expect(passedSet.size).toBe(3);
  });

  it("supports expandable rows", () => {
    render(
      <DataTable
        data={testData}
        columns={columns}
        getRowId={(r) => r.id}
        expandable
        renderExpanded={(row) => <div>Details for {row.name}</div>}
      />
    );
    const expandButtons = screen.getAllByRole("button", { name: /expand/i });
    expect(expandButtons).toHaveLength(3);
    fireEvent.click(expandButtons[0]);
    expect(screen.getByText("Details for Alpha")).toBeInTheDocument();
  });
});

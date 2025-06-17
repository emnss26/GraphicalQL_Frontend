import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";


import { useState, useEffect } from "react";

export default function SheetsTable({ data = [] }) {
  const [rows, setRows] = useState(() =>
    data.map((sheet) => ({
      ...sheet,
      plannedIssueDate: sheet.plannedIssueDate || "",
      realIssueDate: sheet.realIssueDate || "",
    }))
  );

  useEffect(() => {
    setRows(
      data.map((sheet) => ({
        ...sheet,
        plannedIssueDate: sheet.plannedIssueDate || "",
        realIssueDate: sheet.realIssueDate || "",
      }))
    );
  }, [data]);

  const handleChange = (idx, field, value) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };


  return (
    <Table className="table-auto border-collapse w-full">
      <TableHeader>
        <TableRow>
          <TableHead>Sheet Number</TableHead>
          <TableHead>Sheet Name</TableHead>
          <TableHead>Current Revision</TableHead>
          <TableHead>Revision Date</TableHead>
          <TableHead>Revision Description</TableHead>
          <TableHead>Exists in ACC</TableHead>
          <TableHead>Planned Issue Date</TableHead>
          <TableHead>Real Issue Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((sheet, idx) => (
          <TableRow key={idx}>
            <TableCell>{sheet.number}</TableCell>
            <TableCell>{sheet.name}</TableCell>
            <TableCell>{sheet.currentRevision}</TableCell>
            <TableCell>{sheet.currentRevisionDate}</TableCell>
            <TableCell>{sheet.currentRevisionDesc}</TableCell>
            <TableCell>{sheet.inAcc ? "Yes" : "No"}</TableCell>
            <TableCell>
              <Input
                type="date"
                value={sheet.plannedIssueDate}
                onChange={(e) =>
                  handleChange(idx, "plannedIssueDate", e.target.value)
                }
              />
            </TableCell>
            <TableCell>
              <Input
                type="date"
                value={sheet.realIssueDate}
                onChange={(e) =>
                  handleChange(idx, "realIssueDate", e.target.value)
                }
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

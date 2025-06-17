import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export default function SheetsTable({ data = [] }) {
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
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((sheet, idx) => (
          <TableRow key={idx}>
            <TableCell>{sheet.number}</TableCell>
            <TableCell>{sheet.name}</TableCell>
            <TableCell>{sheet.currentRevision}</TableCell>
            <TableCell>{sheet.currentRevisionDate}</TableCell>
            <TableCell>{sheet.currentRevisionDesc}</TableCell>
            <TableCell>{sheet.inAcc ? "Yes" : "No"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

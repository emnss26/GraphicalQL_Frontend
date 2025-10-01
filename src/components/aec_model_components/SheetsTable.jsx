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

/**
 * Props:
 *  - data: Array de filas con (idealmente incluye id):
 *      {
 *        id,
 *        name, number,
 *        currentRevision, currentRevisionDate,
 *        plannedGenDate, actualGenDate,
 *        plannedReviewDate, actualReviewDate,
 *        plannedIssueDate, actualIssueDate,
 *        status
 *      }
 *  - onEdit?: (rowIndex, field, value) => void
 */
export default function SheetsTable({ data = [], onEdit = () => {} }) {
  const toDateInput = (v) => {
    if (!v) return "";
    try {
      const s = typeof v === "string" ? v : new Date(v).toISOString();
      return s.slice(0, 10);
    } catch {
      return "";
    }
  };

  const normalizeRow = (sheet) => ({
    id: sheet.id ?? sheet.plan_id ?? null,

    // editables por el usuario:
    name: sheet.name ?? sheet.sheet_name ?? "",
    number: sheet.number ?? sheet.sheet_number ?? "",

    // llenados por match (pueden venir vacíos por ahora)
    currentRevision: sheet.currentRevision ?? sheet.revision ?? "",
    currentRevisionDate: toDateInput(
      sheet.currentRevisionDate ?? sheet.revisionDate ?? ""
    ),

    // fechas (varias editables mientras no se automaticen)
    plannedGenDate: toDateInput(sheet.plannedGenDate),
    actualGenDate: toDateInput(sheet.actualGenDate),

    plannedReviewDate: toDateInput(sheet.plannedReviewDate),
    actualReviewDate: toDateInput(sheet.actualReviewDate),

    plannedIssueDate: toDateInput(sheet.plannedIssueDate),
    actualIssueDate: toDateInput(sheet.actualIssueDate),

    status: sheet.status ?? "",
  });

  const [rows, setRows] = useState(() => data.map(normalizeRow));

  useEffect(() => {
    setRows(data.map(normalizeRow));
  }, [data]);

  const handleChange = (idx, field, value) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
    onEdit(idx, field, value);
  };

  return (
    <Table className="table-auto border-collapse w-full">
      <TableHeader>
        <TableRow>
          <TableHead>Nombre de Plano</TableHead>
          <TableHead>Número de Plano</TableHead>
          <TableHead>Revisión Actual</TableHead>
          <TableHead>Fecha de Revisión Actual</TableHead>

          <TableHead>Fecha de generación (programada)</TableHead>
          <TableHead>Fecha de generación (Docs)</TableHead>

          <TableHead>Revisión técnica (programada)</TableHead>
          <TableHead>Revisión técnica (real en ACC)</TableHead>

          <TableHead>Emisión a construcción (programada)</TableHead>
          <TableHead>Emisión a construcción (real)</TableHead>

          <TableHead>Estatus de plano</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {rows.map((r, idx) => (
          <TableRow key={r.id ?? idx}>
            {/* Nombre (editable) */}
            <TableCell>
              <Input
                type="text"
                value={r.name}
                onChange={(e) => handleChange(idx, "name", e.target.value)}
                placeholder="Ej. Planta Arquitectónica"
              />
            </TableCell>

            {/* Número (editable) */}
            <TableCell>
              <Input
                type="text"
                value={r.number}
                onChange={(e) => handleChange(idx, "number", e.target.value)}
                placeholder="Ej. A-101"
              />
            </TableCell>

            {/* Revisión actual (solo lectura por ahora) */}
            <TableCell>{r.currentRevision || ""}</TableCell>
            <TableCell>{r.currentRevisionDate || ""}</TableCell>

            {/* Generación programada (editable) */}
            <TableCell>
              <Input
                type="date"
                value={r.plannedGenDate || ""}
                onChange={(e) =>
                  handleChange(idx, "plannedGenDate", e.target.value)
                }
              />
            </TableCell>

            {/* Generación real (Docs) editable por ahora */}
            <TableCell>
              <Input
                type="date"
                value={r.actualGenDate || ""}
                onChange={(e) =>
                  handleChange(idx, "actualGenDate", e.target.value)
                }
              />
            </TableCell>

            {/* Revisión técnica programada (editable) */}
            <TableCell>
              <Input
                type="date"
                value={r.plannedReviewDate || ""}
                onChange={(e) =>
                  handleChange(idx, "plannedReviewDate", e.target.value)
                }
              />
            </TableCell>

            {/* Revisión técnica real (ACC) editable por ahora */}
            <TableCell>
              <Input
                type="date"
                value={r.actualReviewDate || ""}
                onChange={(e) =>
                  handleChange(idx, "actualReviewDate", e.target.value)
                }
              />
            </TableCell>

            {/* Emisión programada (editable) */}
            <TableCell>
              <Input
                type="date"
                value={r.plannedIssueDate || ""}
                onChange={(e) =>
                  handleChange(idx, "plannedIssueDate", e.target.value)
                }
              />
            </TableCell>

            {/* Emisión real (editable por ahora) */}
            <TableCell>
              <Input
                type="date"
                value={r.actualIssueDate || ""}
                onChange={(e) =>
                  handleChange(idx, "actualIssueDate", e.target.value)
                }
              />
            </TableCell>

            <TableCell>{r.status || ""}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

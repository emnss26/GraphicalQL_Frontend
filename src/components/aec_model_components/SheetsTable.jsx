import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

/**
 * Props:
 *  - data: Array de filas (ideal con id):
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
 *  - onDeleteRow?: (rowIndex) => void
 */
export default function SheetsTable({
  data = [],
  onEdit = () => {},
  onDeleteRow = () => {},
}) {
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

    name: sheet.name ?? sheet.sheet_name ?? "",
    number: sheet.number ?? sheet.sheet_number ?? "",

    currentRevision: sheet.currentRevision ?? sheet.revision ?? "",
    currentRevisionDate: toDateInput(
      sheet.currentRevisionDate ?? sheet.revisionDate ?? ""
    ),

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
    <Table className="table-auto border-collapse w-full text-sm">
      <TableHeader>
        <TableRow className="text-sm">
          <TableHead className="text-sm">#</TableHead>
          <TableHead className="text-sm">Nombre de Plano</TableHead>
          <TableHead className="text-sm">Número de Plano</TableHead>
          <TableHead className="text-sm">Revisión Actual</TableHead>
          <TableHead className="text-sm">Fecha de Revisión Actual</TableHead>

          <TableHead className="text-sm">Fecha de generación (programada)</TableHead>
          <TableHead className="text-sm">Fecha de generación (Docs)</TableHead>

          <TableHead className="text-sm">Revisión técnica (programada)</TableHead>
          <TableHead className="text-sm">Revisión técnica (real en ACC)</TableHead>

          <TableHead className="text-sm">Emisión a construcción (programada)</TableHead>
          <TableHead className="text-sm">Emisión a construcción (real)</TableHead>

          <TableHead className="text-sm">Estatus de plano</TableHead>
          <TableHead className="text-sm">Acciones</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {rows.map((r, idx) => (
          <TableRow key={r.id ?? `tmp-${idx}`}>
            <TableCell className="text-muted-foreground">{idx + 1}</TableCell>

            {/* Nombre (editable) */}
            <TableCell>
              <Input
                type="text"
                value={r.name}
                onChange={(e) => handleChange(idx, "name", e.target.value)}
                placeholder="Ej. Planta Arquitectónica"
                className="h-8 text-sm"
              />
            </TableCell>

            {/* Número (editable) */}
            <TableCell>
              <Input
                type="text"
                value={r.number}
                onChange={(e) => handleChange(idx, "number", e.target.value)}
                placeholder="Ej. A-101"
                className="h-8 text-sm"
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
                className="h-8 text-sm"
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
                className="h-8 text-sm"
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
                className="h-8 text-sm"
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
                className="h-8 text-sm"
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
                className="h-8 text-sm"
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
                className="h-8 text-sm"
              />
            </TableCell>

            <TableCell>{r.status || ""}</TableCell>

            {/* Acciones */}
            <TableCell>
              <Button
                variant="outline"
                className="text-red-600 h-8"
                onClick={() => onDeleteRow(idx)}
                title="Eliminar fila"
              >
                Eliminar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

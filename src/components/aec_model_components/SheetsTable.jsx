import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import { Check, X } from "lucide-react";

export default function SheetsTable({
  data = [],
  onEdit = () => {},
  onDeleteRow = () => {},
}) {
  const isoToDMY = (iso) => {
    if (!iso) return "";
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return "";
    const [, y, mm, dd] = m;
    return `${dd}/${mm}/${y}`;
  };

  const dmyToISO = (dmy) => {
    if (!dmy) return "";
    const m = String(dmy).trim().match(/^(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})$/);
    if (!m) return "";
    let [, dd, mm, yy] = m;
    const d = parseInt(dd, 10);
    const mo = parseInt(mm, 10) - 1;
    let y = parseInt(yy, 10);
    if (y < 100) y = 2000 + y;
    const dt = new Date(Date.UTC(y, mo, d));
    return isNaN(dt) ? "" : dt.toISOString().slice(0, 10);
  };

  const toBool = (v) => v === true || v === 1 || v === "1" || String(v).toLowerCase() === "true";
  const todayISO = new Date().toISOString().slice(0, 10);

  const DATE_FIELDS = useMemo(() => [
    "plannedGenDate", "actualGenDate", "plannedReviewDate", "actualReviewDate", "plannedIssueDate", "actualIssueDate",
  ], []);

  const normalizeRow = (sheet) => ({
    id: sheet.id ?? sheet.plan_id ?? null,
    name: sheet.name ?? sheet.sheet_name ?? "",
    number: sheet.number ?? sheet.sheet_number ?? "",
    currentRevision: sheet.currentRevision ?? sheet.current_revision ?? sheet.revision ?? "",
    currentRevisionDate: isoToDMY(sheet.currentRevisionDate ?? sheet.current_revision_date ?? sheet.revisionDate ?? ""),
    plannedGenDate: isoToDMY(sheet.plannedGenDate ?? sheet.planned_gen_date ?? ""),
    actualGenDate: isoToDMY(sheet.actualGenDate ?? sheet.actual_gen_date ?? ""),
    plannedReviewDate: isoToDMY(sheet.plannedReviewDate ?? sheet.planned_review_date ?? ""),
    actualReviewDate: isoToDMY(sheet.actualReviewDate ?? sheet.actual_review_date ?? ""),
    plannedIssueDate: isoToDMY(sheet.plannedIssueDate ?? sheet.planned_issue_date ?? ""),
    actualIssueDate: isoToDMY(sheet.actualIssueDate ?? sheet.actual_issue_date ?? ""),
    hasApprovalFlow: toBool(sheet.hasApprovalFlow ?? sheet.has_approval_flow ?? false),
    status: sheet.status ?? "",
  });

  const [rows, setRows] = useState(() => Array.isArray(data) ? data.map(normalizeRow) : []);
  useEffect(() => {
    setRows(Array.isArray(data) ? data.map(normalizeRow) : []);
  }, [data]);

  const handleChange = (idx, field, valueUI) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: valueUI };
      return updated;
    });
    if (DATE_FIELDS.includes(field)) {
      const iso = dmyToISO(valueUI) || "";
      onEdit(idx, field, iso);
    } else {
      onEdit(idx, field, valueUI);
    }
  };

  const cmpISO = (a, b) => {
    if (!a || !b) return 0;
    return new Date(a).getTime() - new Date(b).getTime();
  };

  const calcRealPct = (r) => {
    if (r.actualIssueDate) return 100;
    const inReview = r.hasApprovalFlow || (r.status && r.status !== "NOT_IN_REVIEW") || !!r.actualReviewDate;
    if (inReview) return 90;
    if (r.actualGenDate) return 85;
    return 0;
  };

  const calcPlannedPct = (r) => {
    const planGen = r.plannedGenDate ? dmyToISO(r.plannedGenDate) : "";
    const planRev = r.plannedReviewDate ? dmyToISO(r.plannedReviewDate) : "";
    const planIss = r.plannedIssueDate ? dmyToISO(r.plannedIssueDate) : "";
    if (planIss && cmpISO(todayISO, planIss) >= 0) return 100;
    if (planRev && cmpISO(todayISO, planRev) >= 0) return 90;
    if (planGen && cmpISO(todayISO, planGen) >= 0) return 85;
    return 0;
  };

  const ProgressCell = ({ r }) => {
    const real = calcRealPct(r);
    const plan = calcPlannedPct(r);
    const delta = real - plan;
    const sign = delta > 0 ? "+" : "";
    return (
      <div className="min-w-[220px]">
        <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className="h-3 bg-[rgb(170,32,47)]"
            style={{ width: `${Math.max(0, Math.min(100, real))}%` }}
            title={`Real ${real}%`}
          />
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Real <span className="font-medium">{real}%</span> · Plan <span className="font-medium">{plan}%</span> · Δ <span className={`font-medium ${delta < 0 ? "text-red-600" : delta > 0 ? "text-green-600" : ""}`}>{sign}{delta} pp</span>
        </div>
      </div>
    );
  };

  return (
    <Table className="table-auto border-collapse w-full text-xs">
      <TableHeader>
        <TableRow className="text-xs">
          <TableHead>#</TableHead>
          <TableHead>Número de Plano</TableHead>
          <TableHead>Nombre de Plano</TableHead>
          <TableHead className="bg-blue-100">Revisión Actual</TableHead>
          <TableHead className="bg-blue-100">Fecha de Revisión Actual</TableHead>
          <TableHead>Fecha de generación (Programada)</TableHead>
          <TableHead className="bg-gray-100">Fecha de generación (Docs)</TableHead>
          <TableHead>Revisión técnica (Programada)</TableHead>
          <TableHead className="bg-gray-100">Flujo de aprobación</TableHead>
          <TableHead className="bg-gray-100">Revisión técnica (Real)</TableHead>
          <TableHead>Emisión a construcción (Programada)</TableHead>
          <TableHead className="bg-gray-100">Emisión a construcción (Real)</TableHead>
          <TableHead>Estatus de plano</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r, idx) => {
          const approvalYes = r.hasApprovalFlow || (r.status && r.status !== "NOT_IN_REVIEW") || !!r.actualReviewDate;
          return (
            <TableRow key={r.id ?? `tmp-${idx}`}>
              <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
              <TableCell>
                <Input type="text" value={r.number} onChange={(e) => handleChange(idx, "number", e.target.value)} className="h-8 text-xs [&>input]:text-xs" />
              </TableCell>
              <TableCell className="min-w-[220px] max-w-[360px]">
                <Input type="text" value={r.name} onChange={(e) => handleChange(idx, "name", e.target.value)} className="h-8 truncate text-xs [&>input]:text-xs" />
              </TableCell>
              <TableCell className="bg-blue-100">{r.currentRevision ?? ""}</TableCell>
              <TableCell className="bg-blue-100">{r.currentRevisionDate ?? ""}</TableCell>
              <TableCell>
                <Input type="text" inputMode="numeric" pattern="\\d{1,2}/\\d{1,2}/\\d{2,4}" placeholder="dd/mm/aaaa" value={r.plannedGenDate || ""} onChange={(e) => handleChange(idx, "plannedGenDate", e.target.value)} className="h-8 text-xs [&>input]:text-xs" />
              </TableCell>
              <TableCell className="bg-gray-100">{r.actualGenDate || ""}</TableCell>
              <TableCell>
                <Input type="text" inputMode="numeric" pattern="\\d{1,2}/\\d{1,2}/\\d{2,4}" placeholder="dd/mm/aaaa" value={r.plannedReviewDate || ""} onChange={(e) => handleChange(idx, "plannedReviewDate", e.target.value)} className="h-8 text-xs [&>input]:text-xs" />
              </TableCell>
              <TableCell className="bg-gray-100 text-center">{approvalYes ? <Check className="w-4 h-4 text-green-600 inline" /> : <X className="w-4 h-4 text-red-500 inline" />}</TableCell>
              <TableCell className="bg-gray-100">{r.actualReviewDate || ""}</TableCell>
              <TableCell>
                <Input type="text" inputMode="numeric" pattern="\\d{1,2}/\\d{1,2}/\\d{2,4}" placeholder="dd/mm/aaaa" value={r.plannedIssueDate || ""} onChange={(e) => handleChange(idx, "plannedIssueDate", e.target.value)} className="h-8 text-xs [&>input]:text-xs" />
              </TableCell>
              <TableCell className="bg-gray-100">{r.actualIssueDate || ""}</TableCell>
              <TableCell>
                <ProgressCell r={r} />
              </TableCell>
              <TableCell>
                <Button variant="outline" className="text-red-600 h-8" onClick={() => onDeleteRow(idx)} title="Eliminar fila">Eliminar</Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
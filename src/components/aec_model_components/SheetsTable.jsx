import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Check,
  X,
  Trash2,
  Calendar,
  FileText,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Columns3,
  Search,
  Filter,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const COLUMN_DEFINITIONS = [
  { id: "index", label: "#", group: "basic", width: "w-12" },
  { id: "number", label: "N° Plano", group: "basic", sortable: true, width: "min-w-[100px]" },
  { id: "name", label: "Nombre", group: "basic", sortable: true, width: "min-w-[140px]" },
  { id: "currentRevision", label: "Rev.", group: "basic", tooltip: "Revisión actual del plano", sortable: true, width: "w-20" },
  { id: "currentRevisionDate", label: "Fecha Rev.", group: "basic", sortable: true, width: "w-28" },

  { id: "plannedGenDate", label: "Gen. Programada", group: "generation", tooltip: "Fecha programada de generación", sortable: true, width: "w-36" },
  { id: "actualGenDate", label: "Gen. Real", group: "generation", sortable: true, width: "w-28" },
  { id: "docsVersion", label: "Ver.", group: "generation", width: "w-16" },
  { id: "docsVersionDate", label: "Últ. Versión", group: "generation", sortable: true, width: "w-28" },

  { id: "plannedReviewDate", label: "Rev. Programada", group: "review", tooltip: "Fecha programada de revisión técnica", sortable: true, width: "w-36" },
  { id: "hasApprovalFlow", label: "Aprob.", group: "review", tooltip: "Aprobación en Docs", width: "w-20" },
  { id: "actualReviewDate", label: "Rev. Real", group: "review", sortable: true, width: "w-28" },
  { id: "lastReviewDate", label: "Últ. Flujo", group: "review", sortable: true, width: "w-28" },
  { id: "lastReviewStatus", label: "Estado Flujo", group: "review", sortable: true, width: "w-24" },

  { id: "plannedIssueDate", label: "Emisión Prog.", group: "issue", tooltip: "Fecha programada de emisión a construcción", sortable: true, width: "w-36" },
  { id: "actualIssueDate", label: "Emisión Real", group: "issue", sortable: true, width: "w-28" },
  { id: "issueUpdatedAt", label: "Actualizado", group: "issue", sortable: true, width: "w-28" },
  { id: "issueVersionSetName", label: "Conjunto", group: "issue", sortable: true, width: "w-24" },

  { id: "progress", label: "Progreso", group: "status", width: "w-32" },
  { id: "actions", label: "Acciones", group: "status", width: "w-24" },
];

const COLUMN_GROUPS = {
  basic: { label: "Información Básica", color: "bg-zinc-500" },
  generation: { label: "Generación", color: "bg-blue-500" },
  review: { label: "Revisión", color: "bg-purple-500" },
  issue: { label: "Emisión", color: "bg-blue-500" },
  status: { label: "Estado", color: "bg-zinc-500" },
};

const isoToDMY = (iso) => {
  if (!iso) return "";
  const m = String(iso).substring(0, 10).match(/^\d{4}-\d{2}-\d{2}$/);
  if (!m) return "";
  const [y, mm, dd] = m[0].split("-");
  return `${dd}/${mm}/${y}`;
};

const dmyToISO = (dmy) => {
  if (!dmy) return "";
  const m = String(dmy).trim().match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})$/);
  if (!m) return "";
  let [, dd, mm, yy] = m;
  const d = parseInt(dd, 10);
  const mo = parseInt(mm, 10) - 1;
  let y = parseInt(yy, 10);
  if (y < 100) y = 2000 + y;
  const dt = new Date(Date.UTC(y, mo, d));
  return isNaN(dt) ? "" : dt.toISOString().slice(0, 10);
};

const toInputDateValue = (dmy) => {
  if (!dmy) return "";
  const parts = dmy.split("/");
  if (parts.length !== 3) return "";
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

const toBool = (v) => v === true || v === 1 || v === "1" || String(v).toLowerCase() === "true";

const ProgressBar = ({ pct }) => {
  let info = { color: "bg-gray-300", label: "Pendiente", textColor: "text-gray-500" };

  if (pct >= 100) info = { color: "bg-green-600", label: "Completado", textColor: "text-green-700" };
  else if (pct >= 66) info = { color: "bg-blue-600", label: "En revisión", textColor: "text-blue-700" };
  else if (pct >= 33) info = { color: "bg-yellow-500", label: "Generado", textColor: "text-yellow-700" };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex min-w-[80px] flex-col gap-1">
            <div className="h-2 w-full overflow-hidden rounded-full border border-gray-200 bg-gray-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${info.color}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px]">
              <span className={`font-medium ${info.textColor}`}>{info.label}</span>
              <span className="font-bold">{pct}%</span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {info.label} ({pct}%)
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const StatusBadge = ({ status }) => {
  const s = String(status || "").toUpperCase();
  let variant = "outline";
  let className = "text-[10px]";

  if (s === "APPROVED" || s === "APROBADO") {
    variant = "default";
    className += " bg-emerald-500 hover:bg-emerald-600 text-white";
  } else if (s === "REJECTED" || s === "RECHAZADO") {
    variant = "destructive";
  } else if (s === "IN_REVIEW" || s.includes("REVIEW") || s.includes("REVISION")) {
    variant = "secondary";
    className += " bg-blue-500 hover:bg-blue-600 text-white";
  } else {
    className += " text-muted-foreground";
  }

  return (
    <Badge variant={variant} className={className}>
      {status || "—"}
    </Badge>
  );
};

// Uncontrolled date input (defaultValue + onBlur commit).
const DateCell = ({ value, editable, onCommit }) => {
  if (editable) {
    return (
      <div className="group relative w-full">
        <Input
          type="date"
          defaultValue={toInputDateValue(value)}
          onBlur={(e) => onCommit?.(e.target.value)}
          className="h-7 w-full cursor-pointer px-1 pr-6 text-xs"
        />
        <Calendar className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground opacity-50" />
      </div>
    );
  }

  return (
    <span className={cn("whitespace-nowrap text-xs", !value && "text-muted-foreground italic")}>
      {value || "—"}
    </span>
  );
};

const SortableHeader = ({
  children,
  tooltip,
  icon: Icon,
  sortable,
  sortDirection,
  onSort,
  className,
}) => {
  const content = (
    <div
      className={cn(
        "flex select-none items-center gap-1.5",
        sortable && "cursor-pointer transition-colors hover:text-foreground",
        className
      )}
      onClick={sortable ? onSort : undefined}
    >
      {Icon && <Icon className="h-3 w-3 opacity-70" />}
      <span className="truncate font-semibold">{children}</span>
      {sortable && (
        <span className="ml-auto">
          {sortDirection === "asc" ? (
            <ChevronUp className="h-3 w-3" />
          ) : sortDirection === "desc" ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronsUpDown className="h-3 w-3 opacity-30" />
          )}
        </span>
      )}
    </div>
  );

  if (!tooltip) return content;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const ColumnVisibilitySelector = ({ columns, visibleColumns, onToggle }) => {
  const groups = useMemo(() => {
    const g = {};
    columns.forEach((col) => {
      if (!g[col.group]) g[col.group] = [];
      g[col.group].push(col);
    });
    return g;
  }, [columns]);

  const handleShowAll = () => {
    columns.forEach((c) => {
      if (!visibleColumns.has(c.id)) onToggle(c.id);
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2 border-dashed">
          <Columns3 className="h-4 w-4" />
          <span className="hidden sm:inline">Columnas</span>
          <Badge variant="secondary" className="h-5 px-1 text-[10px]">
            {visibleColumns.size}
          </Badge>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-64 p-0" align="end">
        <div className="border-b bg-muted/20 p-3">
          <h4 className="text-sm font-medium">Visibilidad de columnas</h4>
        </div>

        <div className="max-h-[300px] overflow-y-auto p-2">
          {Object.entries(groups).map(([groupKey, cols]) => (
            <div key={groupKey} className="mb-4 last:mb-0">
              <div className="mb-2 flex items-center gap-2 px-2">
                <div className={cn("h-2 w-2 rounded-full", COLUMN_GROUPS[groupKey]?.color)} />
                <span className="text-xs font-bold uppercase text-muted-foreground">
                  {COLUMN_GROUPS[groupKey]?.label}
                </span>
              </div>

              {cols.map((col) => (
                <div
                  key={col.id}
                  className="flex cursor-pointer select-none items-center gap-2 rounded px-2 py-1.5 hover:bg-accent"
                >
                  <Checkbox
                    checked={visibleColumns.has(col.id)}
                    id={`col-${col.id}`}
                    onCheckedChange={() => onToggle(col.id)}
                  />
                  <label htmlFor={`col-${col.id}`} className="flex-1 cursor-pointer text-sm">
                    {col.label}
                  </label>
                  {visibleColumns.has(col.id) ? (
                    <Eye className="ml-auto h-3 w-3 text-muted-foreground" />
                  ) : (
                    <EyeOff className="ml-auto h-3 w-3 text-muted-foreground/50" />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="flex justify-between border-t bg-muted/20 p-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleShowAll}
          >
            Mostrar Todo
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default function SheetsTable({ data = [], onEdit = () => {}, onDeleteRow = () => {} }) {
  const [rows, setRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ field: "", direction: null });
  const [visibleColumns, setVisibleColumns] = useState(
    new Set(COLUMN_DEFINITIONS.map((c) => c.id))
  );
  const [deleteTarget, setDeleteTarget] = useState(null); // { index:number, label:string }

  const DATE_FIELDS = useMemo(
    () => [
      "plannedGenDate",
      "actualGenDate",
      "plannedReviewDate",
      "actualReviewDate",
      "plannedIssueDate",
      "actualIssueDate",
    ],
    []
  );

  const normalizeRow = (sheet) => ({
    id: sheet.id ?? sheet.plan_id ?? null,
    name: sheet.name ?? sheet.sheet_name ?? "",
    number: sheet.number ?? sheet.sheet_number ?? "",
    currentRevision: sheet.currentRevision ?? sheet.current_revision ?? "",
    currentRevisionDate: isoToDMY(sheet.currentRevisionDate ?? sheet.current_revision_date ?? ""),
    plannedGenDate: isoToDMY(sheet.plannedGenDate ?? sheet.planned_gen_date ?? ""),
    actualGenDate: isoToDMY(sheet.actualGenDate ?? sheet.actual_gen_date ?? ""),
    docsVersion: sheet.docsVersion ?? sheet.docs_version_number ?? "",
    docsVersionDate: isoToDMY(sheet.docsVersionDate ?? sheet.docs_last_modified ?? ""),
    plannedReviewDate: isoToDMY(sheet.plannedReviewDate ?? sheet.planned_review_date ?? ""),
    actualReviewDate: isoToDMY(sheet.actualReviewDate ?? sheet.actual_review_date ?? ""),
    hasApprovalFlow: toBool(sheet.hasApprovalFlow ?? sheet.has_approval_flow ?? false),
    lastReviewDate: isoToDMY(sheet.lastReviewDate ?? sheet.latest_review_date ?? ""),
    lastReviewStatus: sheet.lastReviewStatus ?? sheet.latest_review_status ?? "",
    plannedIssueDate: isoToDMY(sheet.plannedIssueDate ?? sheet.planned_issue_date ?? ""),
    actualIssueDate: isoToDMY(sheet.actualIssueDate ?? sheet.actual_issue_date ?? ""),
    issueUpdatedAt: isoToDMY(sheet.issueUpdatedAt ?? sheet.sheet_updated_at ?? ""),
    issueVersionSetName: sheet.issueVersionSetName ?? sheet.sheet_version_set ?? "",
    status: sheet.status ?? "",
  });

  useEffect(() => {
    setRows(Array.isArray(data) ? data.map(normalizeRow) : []);
  }, [data]);

  // Keep the original index (realIndex) to avoid rows.indexOf(...) O(n²) lookups.
  const processedRows = useMemo(() => {
    let result = rows.map((row, realIndex) => ({ row, realIndex }));

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(({ row: r }) =>
        r.name.toLowerCase().includes(lower) ||
        r.number.toLowerCase().includes(lower) ||
        r.issueVersionSetName.toLowerCase().includes(lower)
      );
    }

    if (sortConfig.field && sortConfig.direction) {
      result.sort((a, b) => {
        const valA = a.row[sortConfig.field] || "";
        const valB = b.row[sortConfig.field] || "";
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [rows, searchTerm, sortConfig]);

  const handleSort = (field) => {
    setSortConfig((prev) => {
      if (prev.field !== field) return { field, direction: "asc" };
      if (prev.direction === "asc") return { field, direction: "desc" };
      return { field: "", direction: null };
    });
  };

  const toggleColumn = useCallback((id) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const commitCell = (realIndex, field, value) => {
    setRows((prev) => {
      const clone = [...prev];
      clone[realIndex] = { ...clone[realIndex], [field]: value };
      return clone;
    });

    if (DATE_FIELDS.includes(field)) {
      const iso = value ? (dmyToISO(value) || null) : null;
      onEdit(realIndex, field, iso);
      return;
    }

    onEdit(realIndex, field, value);
  };

  const commitDateFromInput = (realIndex, field, yyyyMMdd) => {
    if (!yyyyMMdd) return commitCell(realIndex, field, "");
    const [y, m, d] = yyyyMMdd.split("-");
    return commitCell(realIndex, field, `${d}/${m}/${y}`);
  };

  const getProgress = (r) => {
    if (r.actualIssueDate) return 100;
    if (r.actualReviewDate) return 66;
    if (r.actualGenDate) return 33;
    return 0;
  };

  const isVisible = (id) => visibleColumns.has(id);

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start justify-between gap-3 rounded-lg border bg-card p-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, nombre o conjunto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 bg-background pl-9"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ColumnVisibilitySelector
            columns={COLUMN_DEFINITIONS}
            visibleColumns={visibleColumns}
            onToggle={toggleColumn}
          />
          {searchTerm && (
            <Badge variant="secondary" className="h-9 px-3">
              <Filter className="mr-1 h-3 w-3" />
              {processedRows.length} resultados
            </Badge>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-md border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table className="w-full text-xs">
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/50 hover:bg-muted/50">
                {isVisible("index") && <TableHead className="py-1" />}
                {Object.keys(COLUMN_GROUPS).map((groupKey) => {
                  const groupCols = COLUMN_DEFINITIONS.filter(
                    (c) => c.group === groupKey && isVisible(c.id)
                  );
                  if (groupCols.length === 0) return null;

                  const style =
                    groupKey === "generation" || groupKey === "issue"
                      ? "bg-blue-50 text-blue-700 border-b-blue-200"
                      : "bg-zinc-50 text-zinc-700 border-b-zinc-200";

                  return (
                    <TableHead
                      key={groupKey}
                      colSpan={groupCols.length}
                      className={`border-l border-r border-white py-2 text-center text-[10px] font-bold uppercase tracking-wider ${style}`}
                    >
                      {COLUMN_GROUPS[groupKey].label}
                    </TableHead>
                  );
                })}
              </TableRow>

              <TableRow className="border-b-2 border-border bg-background hover:bg-background">
                {COLUMN_DEFINITIONS.map((col) => {
                  if (!isVisible(col.id)) return null;

                  let cellClass = "h-10 px-3 py-2 border-r last:border-r-0 border-border/50";
                  if (col.group === "generation" || col.group === "issue") cellClass += " bg-blue-50/30";

                  return (
                    <TableHead key={col.id} className={`${col.width} ${cellClass}`}>
                      <SortableHeader
                        icon={
                          col.id === "number"
                            ? FileText
                            : col.id.includes("Date")
                              ? Calendar
                              : null
                        }
                        tooltip={col.tooltip}
                        sortable={col.sortable}
                        sortDirection={sortConfig.field === col.id ? sortConfig.direction : null}
                        onSort={() => handleSort(col.id)}
                      >
                        {col.label}
                      </SortableHeader>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>

            <TableBody>
              {processedRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.size}
                    className="h-32 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="h-8 w-8 opacity-20" />
                      <p>No se encontraron planos</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                processedRows.map(({ row: r, realIndex }) => {
                  const progress = getProgress(r);
                  const rowKey = r.id ?? `temp-${realIndex}`;

                  return (
                    <TableRow
                      key={rowKey}
                      className={cn(
                        "group transition-colors hover:bg-muted/50",
                        progress === 100 && "bg-green-50/40 hover:bg-green-50/60"
                      )}
                    >
                      {isVisible("index") && (
                        <TableCell className="border-r bg-muted/20 text-center font-mono text-muted-foreground">
                          {realIndex + 1}
                        </TableCell>
                      )}

                      {isVisible("number") && (
                        <TableCell className="border-r p-1">
                          <Input
                            key={`${rowKey}-number-${r.number}`}
                            defaultValue={r.number}
                            onBlur={(e) => commitCell(realIndex, "number", e.target.value)}
                            className="h-7 border-transparent bg-transparent text-xs font-medium focus:border-primary"
                          />
                        </TableCell>
                      )}

                      {isVisible("name") && (
                        <TableCell className="border-r p-1">
                          <Input
                            key={`${rowKey}-name-${r.name}`}
                            defaultValue={r.name}
                            onBlur={(e) => commitCell(realIndex, "name", e.target.value)}
                            className="h-7 border-transparent bg-transparent text-xs focus:border-primary"
                          />
                        </TableCell>
                      )}

                      {isVisible("currentRevision") && (
                        <TableCell className="border-r text-center">
                          <Badge variant="outline" className="bg-white">
                            {r.currentRevision}
                          </Badge>
                        </TableCell>
                      )}

                      {isVisible("currentRevisionDate") && (
                        <TableCell className="border-r text-muted-foreground">
                          {r.currentRevisionDate}
                        </TableCell>
                      )}

                      {isVisible("plannedGenDate") && (
                        <TableCell className="border-r bg-blue-50/10 p-1">
                          <DateCell
                            key={`${rowKey}-plannedGenDate-${r.plannedGenDate}`}
                            editable
                            value={r.plannedGenDate}
                            onCommit={(yyyyMMdd) =>
                              commitDateFromInput(realIndex, "plannedGenDate", yyyyMMdd)
                            }
                          />
                        </TableCell>
                      )}

                      {isVisible("actualGenDate") && (
                        <TableCell className="border-r bg-blue-50/20">
                          <DateCell value={r.actualGenDate} />
                        </TableCell>
                      )}

                      {isVisible("docsVersion") && (
                        <TableCell className="border-r bg-blue-50/20 text-center font-mono">
                          {r.docsVersion}
                        </TableCell>
                      )}

                      {isVisible("docsVersionDate") && (
                        <TableCell className="border-r bg-blue-50/20">
                          <DateCell value={r.docsVersionDate} />
                        </TableCell>
                      )}

                      {isVisible("plannedReviewDate") && (
                        <TableCell className="border-r p-1">
                          <DateCell
                            key={`${rowKey}-plannedReviewDate-${r.plannedReviewDate}`}
                            editable
                            value={r.plannedReviewDate}
                            onCommit={(yyyyMMdd) =>
                              commitDateFromInput(realIndex, "plannedReviewDate", yyyyMMdd)
                            }
                          />
                        </TableCell>
                      )}

                      {isVisible("hasApprovalFlow") && (
                        <TableCell className="border-r text-center">
                          {r.hasApprovalFlow ? (
                            <Check className="mx-auto h-4 w-4 text-emerald-500" />
                          ) : (
                            <div className="mx-auto h-1.5 w-1.5 rounded-full bg-gray-200" />
                          )}
                        </TableCell>
                      )}

                      {isVisible("actualReviewDate") && (
                        <TableCell className="border-r">
                          <DateCell value={r.actualReviewDate} />
                        </TableCell>
                      )}

                      {isVisible("lastReviewDate") && (
                        <TableCell className="border-r">
                          <DateCell value={r.lastReviewDate} />
                        </TableCell>
                      )}

                      {isVisible("lastReviewStatus") && (
                        <TableCell className="border-r">
                          <StatusBadge status={r.lastReviewStatus} />
                        </TableCell>
                      )}

                      {isVisible("plannedIssueDate") && (
                        <TableCell className="border-r bg-blue-50/10 p-1">
                          <DateCell
                            key={`${rowKey}-plannedIssueDate-${r.plannedIssueDate}`}
                            editable
                            value={r.plannedIssueDate}
                            onCommit={(yyyyMMdd) =>
                              commitDateFromInput(realIndex, "plannedIssueDate", yyyyMMdd)
                            }
                          />
                        </TableCell>
                      )}

                      {isVisible("actualIssueDate") && (
                        <TableCell className="border-r bg-blue-50/20">
                          <DateCell value={r.actualIssueDate} />
                        </TableCell>
                      )}

                      {isVisible("issueUpdatedAt") && (
                        <TableCell className="border-r bg-blue-50/20">
                          <DateCell value={r.issueUpdatedAt} />
                        </TableCell>
                      )}

                      {isVisible("issueVersionSetName") && (
                        <TableCell className="border-r bg-blue-50/20 text-muted-foreground">
                          {r.issueVersionSetName}
                        </TableCell>
                      )}

                      {isVisible("progress") && (
                        <TableCell className="border-r bg-gray-50/30 px-2">
                          <ProgressBar pct={progress} />
                        </TableCell>
                      )}

                      {isVisible("actions") && (
                        <TableCell className="bg-gray-50/30 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() =>
                              setDeleteTarget({
                                index: realIndex,
                                label: `${r.number || "—"} · ${r.name || "Sin nombre"}`,
                              })
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
        <div>
          Mostrando {processedRows.length} de {rows.length} registros
        </div>

        <div className="flex gap-4">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            Generación/Emisión
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-purple-500" />
            Revisión
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este plano?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar: <span className="font-medium">{deleteTarget?.label}</span>. Esta acción no
              se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleteTarget) return;
                onDeleteRow(deleteTarget.index);
                setDeleteTarget(null);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

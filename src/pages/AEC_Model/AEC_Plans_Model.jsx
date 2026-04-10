import React, { useEffect, useMemo, useRef, useState } from "react";
import { useCookies } from "react-cookie";
import { useParams } from "react-router-dom";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import AlertsTable from "@/components/aec_model_components/AlertsTable";

import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  AlertCircle,
  BarChart3,
  Boxes,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileDown,
  FileText,
  FileUp,
  FolderOpen,
  Plus,
  Sparkles,
  Table2,
  Zap,
} from "lucide-react";

import AppLayout from "@/components/general_component/AppLayout";
import AnalyticsDashboard from "@/components/general_component/AnalyticsDashboard";
import AbitatLogoLoader from "@/components/general_component/AbitatLogoLoader";
import SheetsTable from "@/components/aec_model_components/SheetsTable";
import ControlTable from "@/components/aec_model_components/ControlTable";
import WeeklyTrackingTable from "@/components/aec_model_components/WeeklyTrackingTable";
import SelectFolderModal from "@/components/aec_model_components/SelectFolderModal";
import SelectModelsModal from "@/components/aec_model_components/SelectModelModal";


import autoTable from "jspdf-autotable";

const backendUrl = String(import.meta.env.VITE_API_BACKEND_BASE_URL || "").replace(/\/$/, "");

const emptyPlan = () => ({
  id: null,
  name: "",
  number: "",
  specialty: "",
  currentRevision: "",
  currentRevisionDate: "",
  plannedGenDate: "",
  actualGenDate: "",
  plannedReviewDate: "",
  actualReviewDate: "",
  plannedIssueDate: "",
  actualIssueDate: "",
  hasApprovalFlow: false,
  status: "",
});

const norm = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");

const excelSerialToISO = (n) => {
  if (typeof n !== "number" || !isFinite(n)) return "";
  const base = new Date(Date.UTC(1899, 11, 30));
  base.setUTCDate(base.getUTCDate() + Math.floor(n));
  return base.toISOString().slice(0, 10);
};

const dmyToISO = (s) => {
  const m = String(s || "").trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (!m) return "";
  let [, dd, mm, yy] = m;
  const d = parseInt(dd, 10);
  const mo = parseInt(mm, 10) - 1;
  let y = parseInt(yy, 10);
  if (y < 100) y = 2000 + y;
  const dt = new Date(Date.UTC(y, mo, d));
  return isNaN(dt) ? "" : dt.toISOString().slice(0, 10);
};

const toISODate = (v) => {
  if (!v && v !== 0) return "";
  if (v instanceof Date) return isNaN(v) ? "" : v.toISOString().slice(0, 10);
  if (typeof v === "number") return excelSerialToISO(v);
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const mx = dmyToISO(s);
    if (mx) return mx;
    const d = new Date(s);
    return isNaN(d) ? "" : d.toISOString().slice(0, 10);
  }
  return "";
};

const isoToDMY = (iso) => {
  if (!iso) return "";
  const m = String(iso).substring(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  const [, y, mm, dd] = m;
  return `${dd}/${mm}/${y}`;
};

const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== "";
const getFirstFilledValue = (obj, keys) => {
  for (const key of keys) {
    if (hasValue(obj?.[key])) return obj[key];
  }
  return "";
};
const isApprovedReviewStatus = (value) => {
  const status = String(value || "").trim().toUpperCase();
  return status === "APPROVED" || status === "APROBADO" || status.includes("APPROVED") || status.includes("APROBADO");
};
const getPlanProgressInfo = (plan) => {
  if (hasValue(getFirstFilledValue(plan, ["actualIssueDate", "actual_issue_date"]))) {
    return { pct: 100, label: "Emitido a construccion" };
  }

  if (isApprovedReviewStatus(getFirstFilledValue(plan, ["lastReviewStatus", "latest_review_status"]))) {
    return { pct: 95, label: "Aprobado" };
  }

  if (hasValue(getFirstFilledValue(plan, ["lastReviewDate", "latest_review_date"]))) {
    return { pct: 90, label: "Con flujo de revision" };
  }

  if (hasValue(getFirstFilledValue(plan, [
    "actualGenDate",
    "actual_gen_date",
    "docsVersion",
    "docs_version_number",
    "docsVersionDate",
    "docs_last_modified",
  ]))) {
    return { pct: 85, label: "Publicado en Docs" };
  }

  return { pct: 0, label: "Pendiente" };
};

const isNombre = (h) => ["nombre de plano", "nombre", "sheet name", "title"].includes(norm(h));
const isEspecialidad = (h) => ["especialidad", "specialty", "disciplina"].includes(norm(h));
const isNumero = (h) => ["nÃºmero de plano", "numero de plano", "nÃºmero", "numero", "sheet number", "no.", "no"].includes(norm(h));
const isGenProg = (h) => ["fecha gen. (programada)", "fecha de generaciÃ³n (programada)", "fecha de generacion (programada)", "planned generation date"].includes(norm(h));
const isRevProg = (h) => ["rev. tÃ©cnica (programada)", "revisiÃ³n tÃ©cnica (programada)", "revision tecnica (programada)", "planned review date"].includes(norm(h));
const isEmiProg = (h) => ["emisiÃ³n (programada)", "emision (programada)", "emisiÃ³n a construcciÃ³n (programada)", "planned issue date"].includes(norm(h));

const TABLE_COLUMN_ORDER = [
  "index",
  "specialty",
  "number",
  "name",
  "currentRevision",
  "currentRevisionDate",
  "plannedGenDate",
  "actualGenDate",
  "docsVersion",
  "docsVersionDate",
  "plannedReviewDate",
  "hasApprovalFlow",
  "actualReviewDate",
  "lastReviewDate",
  "lastReviewStatus",
  "plannedIssueDate",
  "actualIssueDate",
  "issueUpdatedAt",
  "issueVersionSetName",
  "progress",
  "actions",
];

const CONTROL_INFO_COLUMN_ORDER = [
  "number",
  "name",
  "plannedGenDate",
  "actualGenDate",
  "plannedReviewDate",
  "actualReviewDate",
  "plannedIssueDate",
  "actualIssueDate",
];

// --- Componente Principal ---
export default function AECModelPlansPage() {
  useCookies(["access_token"]);
  const { projectId } = useParams();

  const [alerts, setAlerts] = useState([]);

  const altProjectId = sessionStorage.getItem("altProjectId");
  const projectName = sessionStorage.getItem("projectName");

  const [viewMode, setViewMode] = useState("table");

  // Estados de Datos
  const [models, setModels] = useState([]);
  const [folderTree, setFolderTree] = useState([]);
  
  const [selectedModelsIds, setSelectedModelsIds] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(null);

  const [plans, setPlans] = useState([]);
  
  const [modalModelsOpen, setModalModelsOpen] = useState(false);
  const [modalFoldersOpen, setModalFoldersOpen] = useState(false);
  
  const [error, setError] = useState("");
  const [isReadOnlyAccess, setIsReadOnlyAccess] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingTree, setLoadingTree] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [visibleTableColumns, setVisibleTableColumns] = useState(() => [...TABLE_COLUMN_ORDER]);
  const [visibleControlColumns, setVisibleControlColumns] = useState(() => [...CONTROL_INFO_COLUMN_ORDER]);
  const [trackingRestrictionsByWeek, setTrackingRestrictionsByWeek] = useState({});
  const [controlCommentsByKey, setControlCommentsByKey] = useState({});

  const fileInputRef = useRef(null);
  const reportRef = useRef(null); 
  const dashboardExportRef = useRef(null);
  const trackingExportRef = useRef(null);

  const apiBase = (backendUrl || "").replace(/\/$/, "");
  const pId = encodeURIComponent(projectId || "");
  
  const TABLOID_LANDSCAPE_MM = [431.8, 279.4];
  const fmtDMY = (iso) => isoToDMY(iso || "");

  const toControlCommentIdKey = (id) => {
    if (id === undefined || id === null || String(id).trim() === "") return "";
    return `id:${String(id).trim()}`;
  };

  const toControlCommentRefKey = (number, name) => {
    const numberKey = norm(number || "");
    const nameKey = norm(name || "");
    if (!numberKey && !nameKey) return "";
    return `num:${numberKey}|name:${nameKey}`;
  };

  const getPlanCommentKeys = (planLike) => {
    const idKey = toControlCommentIdKey(planLike?.id ?? planLike?.planId ?? planLike?.plan_id);
    const refKey = toControlCommentRefKey(
      planLike?.number ?? planLike?.planNumber ?? planLike?.sheet_number,
      planLike?.name ?? planLike?.planName ?? planLike?.sheet_name
    );
    return { idKey, refKey };
  };


  const safeJson = async (res, urlForMsg) => {
    const ctype = res.headers.get("content-type") || "";
    if (!ctype.includes("application/json")) {
      const txt = await res.text();
      throw new Error(
        `Respuesta no JSON (${res.status}). URL: ${urlForMsg}. Detalle: ${txt.slice(0, 200)}...`
      );
    }
    return res.json();
  };

  const getApiErrorMessage = (payload, fallbackMessage) =>
    payload?.error || payload?.message || fallbackMessage;

  const fetchJsonOrThrow = async (url, fallbackMessage) => {
    const response = await fetch(url, { credentials: "include" });
    const json = await safeJson(response, url);
    if (!response.ok || json?.success === false) {
      throw new Error(getApiErrorMessage(json, fallbackMessage));
    }
    return json;
  };

  const stats = useMemo(() => {
    const total = plans.length;
    const completed = plans.filter((d) => d.actualIssueDate || d.actual_issue_date).length;
    const inReview = plans.filter(
      (d) => (d.actualReviewDate || d.actual_review_date) && !(d.actualIssueDate || d.actual_issue_date)
    ).length;
    const pending = total - completed - inReview;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const processProgressSum = plans.reduce((sum, plan) => sum + getPlanProgressInfo(plan).pct, 0);
    const processProgressPct = total > 0 ? processProgressSum / total : 0;
    return { total, completed, inReview, pending, completionRate, processProgressPct };
  }, [plans]);

  const plansForControl = useMemo(() => {
    return plans.map((plan) => {
      const { idKey, refKey } = getPlanCommentKeys(plan);
      const comment =
        (idKey && controlCommentsByKey[idKey] !== undefined ? controlCommentsByKey[idKey] : undefined) ??
        (refKey && controlCommentsByKey[refKey] !== undefined ? controlCommentsByKey[refKey] : undefined) ??
        plan.comment ??
        plan.comments ??
        plan.controlComment ??
        "";
      return { ...plan, comment };
    });
  }, [plans, controlCommentsByKey, getPlanCommentKeys]);

  const loadAlerts = async () => {
    try {
      const r = await fetch(`${apiBase}/plans/${pId}/alerts`, { credentials: "include" });
      const j = await safeJson(r, "alerts");
      setAlerts(j.data?.alerts || []);
      return true;
    } catch (e) {
      console.error("Error cargando alertas:", e);
      setAlerts([]);
      return false;
    }
  };

  const loadTrackingRestrictions = async () => {
    try {
      const url = `${apiBase}/plans/${pId}/tracking/restrictions`;
      const r = await fetch(url, { credentials: "include" });
      const j = await safeJson(r, "tracking/restrictions");
      if (!r.ok) throw new Error(j?.error || "Error cargando restricciones.");
      const restrictions = j.data?.restrictions || [];
      const map = {};
      restrictions.forEach((item) => {
        const weekKey = String(item.weekKey || item.week_key || "").trim();
        if (!weekKey) return;
        map[weekKey] = String(item.restriction || "");
      });
      setTrackingRestrictionsByWeek(map);
      return true;
    } catch (e) {
      console.error("Error cargando restricciones de seguimiento:", e);
      setTrackingRestrictionsByWeek({});
      return false;
    }
  };

  const loadControlComments = async () => {
    try {
      const url = `${apiBase}/plans/${pId}/control/comments`;
      const r = await fetch(url, { credentials: "include" });
      const j = await safeJson(r, "control/comments");
      if (!r.ok) throw new Error(j?.error || "Error cargando comentarios de control.");
      const comments = j.data?.comments || [];
      const map = {};
      comments.forEach((item) => {
        const text = String(item.comment || "");
        const { idKey, refKey } = getPlanCommentKeys(item);
        if (idKey) map[idKey] = text;
        if (refKey) map[refKey] = text;
      });
      setControlCommentsByKey(map);
      return true;
    } catch (e) {
      console.error("Error cargando comentarios de control:", e);
      setControlCommentsByKey({});
      return false;
    }
  };

  const loadOptionalSections = async ({ showToast = false } = {}) => {
    const sections = [
      { label: "alertas", load: loadAlerts },
      { label: "restricciones de seguimiento", load: loadTrackingRestrictions },
      { label: "comentarios de control", load: loadControlComments },
    ];

    const results = await Promise.allSettled(sections.map(({ load }) => load()));
    const failedSections = results.flatMap((result, index) => {
      if (result.status === "fulfilled" && result.value !== false) return [];
      return [sections[index].label];
    });

    if (showToast && failedSections.length > 0) {
      toast.warning("Se cargaron los planes, pero faltan datos auxiliares.", {
        description: failedSections.join(", "),
      });
    }

    return failedSections;
  };

  // 1. CARGA INICIAL
  useEffect(() => {
    const initData = async () => {
      setIsLoadingInitial(true);
      setIsReadOnlyAccess(true);
      setTrackingRestrictionsByWeek({});
      setControlCommentsByKey({});
      setError("");

      const accessPromise = fetchJsonOrThrow(
        `${apiBase}/acc/projects/${pId}/current-user-access`,
        "No se pudo resolver el acceso actual."
      )
        .then((accessJson) => {
          setIsReadOnlyAccess(Boolean(accessJson?.isReadOnlyAccess));
          return accessJson;
        })
        .catch((accessError) => {
          console.warn("No se pudo resolver acceso actual del usuario:", accessError);
          setIsReadOnlyAccess(true);
          return null;
        });

      try {
        const [selFolders, selModels] = await Promise.all([
          fetchJsonOrThrow(
            `${apiBase}/aec/${pId}/graphql-folders/get-selection`,
            "No se pudo cargar la carpeta seleccionada."
          ).catch((selectionError) => {
            console.warn("No se pudo cargar la carpeta seleccionada:", selectionError);
            return null;
          }),
          fetchJsonOrThrow(
            `${apiBase}/aec/${pId}/graphql-models/get-selection`,
            "No se pudo cargar la seleccion de modelos."
          ).catch((selectionError) => {
            console.warn("No se pudo cargar la seleccion de modelos:", selectionError);
            return null;
          }),
        ]);

        setSelectedFolderId(selFolders?.data?.folderId || null);
        setSelectedModelsIds(selModels?.data?.modelIds || []);

        const plansJson = await fetchJsonOrThrow(
          `${apiBase}/plans/${pId}/plans`,
          "No se pudieron cargar los planes."
        );
        const loaded = plansJson.data?.plans ?? [];
        setPlans(loaded.length === 0 ? Array.from({ length: 10 }, emptyPlan) : loaded);

        await loadOptionalSections({ showToast: true });
        await accessPromise;

      } catch (err) {
        console.error("Error carga inicial:", err);
        setError(err.message || "No se pudieron cargar los planes.");
        setPlans((prev) =>
          prev.length === 0 ? Array.from({ length: 10 }, emptyPlan) : prev
        );
      } finally {
        setIsLoadingInitial(false);
      }
    };

    if (pId) initData();
  }, [apiBase, pId]);

  useEffect(() => {
    if (!pId) return;
    if (viewMode === "tracking") {
      loadTrackingRestrictions().then((ok) => {
        if (!ok) {
          toast.warning("No se pudieron actualizar las restricciones de seguimiento.");
        }
      });
    }
    if (viewMode === "control") {
      loadControlComments().then((ok) => {
        if (!ok) {
          toast.warning("No se pudieron actualizar los comentarios de control.");
        }
      });
    }
  }, [viewMode, pId]);

  useEffect(() => {
    if (viewMode === "alerts" && isReadOnlyAccess) {
      setViewMode("table");
    }
  }, [isReadOnlyAccess, viewMode]);

  // 2. HANDLERS
  const handleOpenModelsModal = async () => {
    if (isReadOnlyAccess) return;

    setModalModelsOpen(true);
    if (models.length === 0) {
        setLoadingModels(true);
        const tId = toast.loading("Cargando lista de modelos..."); 
        try {
            const r = await fetch(`${apiBase}/aec/${pId}/graphql-models`, { credentials: "include" });
            const j = await safeJson(r, "graphql-models");
            if(!j.success && j.error) throw new Error(j.error);
            setModels(j.data?.models || []);
            toast.success("Modelos cargados", { id: tId });
        } catch (e) {
            console.error("Error cargando modelos:", e);
            toast.error("Error al obtener modelos.", { id: tId });
        } finally {
            setLoadingModels(false);
        }
    }
  };

  const handleOpenFoldersModal = async () => {
    if (isReadOnlyAccess) return;

    setModalFoldersOpen(true);
    if (folderTree.length === 0) {
        if (!altProjectId) {
            toast.error("Falta ID de Data Management.");
            return;
        }
        setLoadingTree(true);
        const tId = toast.loading("Escaneando estructura de carpetas...");
        try {
            const endpoint = `${apiBase}/dm/project-folders?dmId=${altProjectId}`;
            const response = await fetch(endpoint, { credentials: "include" });
            const result = await safeJson(response, endpoint);
            if (!result.success) throw new Error(result.message);
            setFolderTree(result.data.folderTree || []);
            toast.success("Estructura cargada.", { id: tId });
        } catch (err) {
            console.error("Error cargando Arbol DM:", err);
            toast.error("Error al cargar carpetas.", { id: tId });
        } finally {
            setLoadingTree(false);
        }
    }
  };

  const handleAddRow = () => {
    if (isReadOnlyAccess) return;
    setPlans((prev) => [...prev, emptyPlan()]);
  };
  
  const handleDeleteRow = async (rowIndex) => {
    if (isReadOnlyAccess) return;

    const row = plans[rowIndex];
    if (!row) return;

    if (row?.id) {
      try {
        const url = `${apiBase}/plans/${pId}/plans/${row.id}`;
        const res = await fetch(url, { method: "DELETE", credentials: "include" });
        const json = await safeJson(res, url);
        if (!res.ok || json?.success === false) {
          throw new Error(getApiErrorMessage(json, "No se pudo eliminar el plano."));
        }
      } catch (e) {
        console.error("DELETE falló:", e);
        toast.error(e.message || "No se pudo eliminar el plano.");
        return;
      }
    }

    setPlans((prev) => prev.filter((_, i) => i !== rowIndex));
    toast.success("Plano eliminado.");
  };

  const handleClickImport = () => {
    if (isReadOnlyAccess) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    let tId;
    try {
      if (isReadOnlyAccess) return;

      const file = e.target.files?.[0];
      if (!file) return;

      if (/\.xls$/i.test(file.name) && !/\.xlsx$/i.test(file.name)) {
        throw new Error("Formato .xls no soportado. Usa .xlsx.");
      }

      tId = toast.loading("Importando Excel...");
      const [{ Workbook }] = await Promise.all([import("exceljs")]);
      const workbook = new Workbook();
      const buf = await file.arrayBuffer();
      await workbook.xlsx.load(buf);

      const worksheet = workbook.worksheets?.[0];
      if (!worksheet) throw new Error("Archivo vaci­o.");

      const normalizeCell = (value) => {
        if (value == null) return "";
        if (value instanceof Date) return value;
        if (typeof value === "object") {
          if (value.result != null) return normalizeCell(value.result);
          if (typeof value.text === "string") return value.text;
          if (Array.isArray(value.richText)) {
            return value.richText.map((part) => part?.text || "").join("");
          }
          if (typeof value.hyperlink === "string") {
            return value.text || value.hyperlink;
          }
        }
        return value;
      };

      const columnCount = Math.max(worksheet.columnCount || 0, 1);
      const rowCount = Math.max(worksheet.rowCount || 0, 1);
      const rows = [];

      for (let rowIndex = 1; rowIndex <= rowCount; rowIndex += 1) {
        const row = worksheet.getRow(rowIndex);
        const values = [];
        for (let colIndex = 1; colIndex <= columnCount; colIndex += 1) {
          values.push(normalizeCell(row.getCell(colIndex).value));
        }
        rows.push(values);
      }

      if (!rows.length) throw new Error("Archivo vaci­o.");

      const headers = rows[0].map((h) => String(h ?? "").trim());
      let idxNombre = -1;
      let idxNumero = -1;
      let idxSpecialty = -1;
      let idxGen = -1;
      let idxRev = -1;
      let idxEmi = -1;

      headers.forEach((h, i) => {
        if (idxNombre === -1 && isNombre(h)) idxNombre = i;
        if (idxNumero === -1 && isNumero(h)) idxNumero = i;
        if (idxSpecialty === -1 && isEspecialidad(h)) idxSpecialty = i;
        if (idxGen === -1 && isGenProg(h)) idxGen = i;
        if (idxRev === -1 && isRevProg(h)) idxRev = i;
        if (idxEmi === -1 && isEmiProg(h)) idxEmi = i;
      });

      if (idxNumero === -1 || idxNombre === -1) {
        throw new Error("Faltan columnas requeridas.");
      }

      const plansPayload = rows
        .slice(1)
        .map((r) => {
          const valueAt = (idx) => (idx >= 0 ? normalizeCell(r[idx]) : "");
          return {
            name: String(valueAt(idxNombre) ?? "").trim(),
            number: String(valueAt(idxNumero) ?? "").trim(),
            specialty: String(valueAt(idxSpecialty) ?? "").trim(),
            plannedGenDate: idxGen >= 0 ? toISODate(valueAt(idxGen)) : "",
            plannedReviewDate: idxRev >= 0 ? toISODate(valueAt(idxRev)) : "",
            plannedIssueDate: idxEmi >= 0 ? toISODate(valueAt(idxEmi)) : "",
          };
        })
        .filter((p) => p.name || p.number);

      if (!plansPayload.length) throw new Error("No hay datos validos.");

      const url = `${apiBase}/plans/${pId}/plans/import`;
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plans: plansPayload }),
      });
      const data = await safeJson(res, url);
      if (!res.ok) throw new Error(data?.error || "Error importando.");

      e.target.value = "";
      const reloadRes = await fetch(`${apiBase}/plans/${pId}/plans`, { credentials: "include" });
      const reloadJson = await safeJson(reloadRes, "reload");
      setPlans(reloadJson.data?.plans || []);
      await loadControlComments();

      toast.success("Importación completada.", { id: tId });
    } catch (err) {
      console.error(err);
      if (tId) toast.error(`Error: ${err.message}`, { id: tId });
      else toast.error(`Error: ${err.message}`);
    }
  };

  const handleExportExcel = async () => {
    try {
      const getFirst = (obj, keys) => {
        for (const key of keys) {
          const value = obj?.[key];
          if (value !== undefined && value !== null && String(value).trim() !== "") {
            return value;
          }
        }
        return "";
      };

      const getProgressStatus = (obj) => getPlanProgressInfo(obj).label;

      const exportData = plans.map((r) => ({
        "Nombre de plano": getFirst(r, ["name", "sheet_name"]),
        "NÃºmero de plano": getFirst(r, ["number", "sheet_number"]),
        "RevisiÃ³n Actual": getFirst(r, ["currentRevision", "current_revision"]),
        "Fecha Rev. Actual": isoToDMY(getFirst(r, ["currentRevisionDate", "current_revision_date"])),
        "Fecha gen. (programada)": isoToDMY(getFirst(r, ["plannedGenDate", "planned_gen_date"])),
        "Fecha gen. (real)": isoToDMY(getFirst(r, ["actualGenDate", "actual_gen_date"])),
        "Rev. tÃ©cnica (programada)": isoToDMY(getFirst(r, ["plannedReviewDate", "planned_review_date"])),
        "Rev. tÃ©cnica (real)": isoToDMY(getFirst(r, ["actualReviewDate", "actual_review_date"])),
        "EmisiÃ³n (programada)": isoToDMY(getFirst(r, ["plannedIssueDate", "planned_issue_date"])),
        "EmisiÃ³n (real)": isoToDMY(getFirst(r, ["actualIssueDate", "actual_issue_date"])),
        Especialidad: getFirst(r, ["specialty"]),
        Conjunto: getFirst(r, ["issueVersionSetName", "sheet_version_set"]),
        Estado: getFirst(r, ["status"]) || getProgressStatus(r),
      }));

      const [{ Workbook }] = await Promise.all([import("exceljs")]);
      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet("Planos");

      const columns = [
        "Nombre de plano",
        "NÃºmero de plano",
        "RevisiÃ³n Actual",
        "Fecha Rev. Actual",
        "Fecha gen. (programada)",
        "Fecha gen. (real)",
        "Rev. tÃ©cnica (programada)",
        "Rev. tÃ©cnica (real)",
        "EmisiÃ³n (programada)",
        "EmisiÃ³n (real)",
        "Especialidad",
        "Conjunto",
        "Estado",
      ];

      worksheet.columns = columns.map((header) => ({
        header,
        key: header,
        width: Math.max(16, header.length + 2),
      }));

      exportData.forEach((row) => worksheet.addRow(row));

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeProjectName = String(projectName || "Proyecto").replace(/[^\w.-]+/g, "_");
      link.href = url;
      link.download = `Planos_${safeProjectName}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Excel exportado.");
    } catch (err) {
      console.error(err);
      toast.error("No fue posible exportar el Excel.");
    }
  };
  const handleEdit = async (rowIndex, field, value) => {
    if (isReadOnlyAccess) return;

    try {
      const planId = plans[rowIndex]?.id;
      setPlans((prev) => {
        const clone = [...prev];
        clone[rowIndex] = { ...clone[rowIndex], [field]: value };
        return clone;
      });
      if (!planId) return;
      const url = `${apiBase}/plans/${pId}/plans/${planId}`;
      const res = await fetch(url, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      const json = await safeJson(res, url);
      if (!res.ok) throw new Error(json?.error);
    } catch (err) {
      console.error(err);
      toast.error("Error guardando cambio.");
    }
  };

  const handleTrackingRestrictionChange = async ({ weekKey, trackingWeek, weekEnd, restriction }) => {
    const safeWeekKey = String(weekKey || "").trim();
    if (!safeWeekKey) return;
    const newRestriction = String(restriction || "");
    const restrictionToPersist = newRestriction.trim() ? newRestriction : "";
    const previousRestriction = trackingRestrictionsByWeek[safeWeekKey] || "";

    setTrackingRestrictionsByWeek((prev) => ({
      ...prev,
      [safeWeekKey]: restrictionToPersist,
    }));

    try {
      const url = `${apiBase}/plans/${pId}/tracking/restrictions/${encodeURIComponent(safeWeekKey)}`;
      const res = await fetch(url, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingWeek: Number.isFinite(Number(trackingWeek)) ? Number(trackingWeek) : null,
          weekEnd: weekEnd || null,
          restriction: restrictionToPersist,
        }),
      });
      const json = await safeJson(res, url);
      if (!res.ok) throw new Error(json?.error || "Error guardando restriccion.");

      setTrackingRestrictionsByWeek((prev) => {
        const next = { ...prev };
        if (restrictionToPersist.trim()) next[safeWeekKey] = restrictionToPersist;
        else delete next[safeWeekKey];
        return next;
      });
    } catch (err) {
      console.error(err);
      setTrackingRestrictionsByWeek((prev) => {
        const next = { ...prev };
        if (previousRestriction.trim()) next[safeWeekKey] = previousRestriction;
        else delete next[safeWeekKey];
        return next;
      });
      toast.error("Error guardando restriccion de seguimiento.");
    }
  };

  const handleControlCommentChange = async (row, commentValue) => {
    if (isReadOnlyAccess) return;

    const rowIndex = Number(row?.originalIndex);
    const basePlan = Number.isFinite(rowIndex) ? plans[rowIndex] : null;
    const planId = basePlan?.id ?? null;
    const planNumber = String(row?.number ?? basePlan?.number ?? basePlan?.sheet_number ?? "").trim();
    const planName = String(row?.name ?? basePlan?.name ?? basePlan?.sheet_name ?? "").trim();
    const comment = String(commentValue || "");
    const commentToPersist = comment.trim() ? comment : "";

    if (!planId && !planNumber && !planName) {
      toast.warning("No se pudo identificar el plano para guardar comentario.");
      return;
    }

    const { idKey, refKey } = getPlanCommentKeys({
      id: planId,
      number: planNumber,
      name: planName,
    });
    const previousById = idKey ? controlCommentsByKey[idKey] : undefined;
    const previousByRef = refKey ? controlCommentsByKey[refKey] : undefined;

    try {
      const url = `${apiBase}/plans/${pId}/control/comments`;
      const payload = { comment: commentToPersist };
      if (planId) payload.planId = planId;
      if (planNumber) payload.planNumber = planNumber;
      if (planName) payload.planName = planName;

      const res = await fetch(url, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await safeJson(res, url);
      if (!res.ok) throw new Error(json?.error || "Error guardando comentario.");

      setControlCommentsByKey((prev) => {
        const next = { ...prev };
        if (idKey) {
          if (commentToPersist.trim()) next[idKey] = commentToPersist;
          else delete next[idKey];
        }
        if (refKey) {
          if (commentToPersist.trim()) next[refKey] = commentToPersist;
          else delete next[refKey];
        }
        return next;
      });
    } catch (err) {
      console.error(err);
      setControlCommentsByKey((prev) => {
        const next = { ...prev };
        if (idKey) {
          if (previousById !== undefined) next[idKey] = previousById;
          else delete next[idKey];
        }
        if (refKey) {
          if (previousByRef !== undefined) next[refKey] = previousByRef;
          else delete next[refKey];
        }
        return next;
      });
      toast.error("Error guardando comentario de control.");
    }
  };

  const handleSaveList = async () => {
    if (isReadOnlyAccess) return;

    try {
      const draftRows = plans.filter((p) => !p.id);
      if (!draftRows.length) {
        toast.info("No hay filas nuevas por enviar.");
        return;
      }

      const validDraftRows = draftRows.filter(
        (p) => String(p.name || "").trim() && String(p.number || "").trim()
      );
      const skippedRows = draftRows.length - validDraftRows.length;

      if (!validDraftRows.length) {
        toast.warning("Completa Nombre y NÃºmero en las filas nuevas.");
        return;
      }

      const payload = validDraftRows.map((p) => ({
          name: p.name,
          number: p.number,
          specialty: p.specialty || "",
          plannedGenDate: p.plannedGenDate || "",
          plannedReviewDate: p.plannedReviewDate || "",
          plannedIssueDate: p.plannedIssueDate || "",
      }));

      if (!payload.length) {
        toast.warning("No hay datos para guardar.");
        return;
      }
      const tId = toast.loading("Guardando lista...");
      const url = `${apiBase}/plans/${pId}/plans/import`;
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plans: payload }),
      });
      const saveJson = await safeJson(res, url);
      if (!res.ok) {
        throw new Error(getApiErrorMessage(saveJson, "Error al guardar."));
      }
      
      const reloadRes = await fetch(`${apiBase}/plans/${pId}/plans`, { credentials: "include" });
      const reloadJson = await safeJson(reloadRes, "reload");
      setPlans(reloadJson.data?.plans || []);
      await loadControlComments();

      if (skippedRows > 0) {
        toast.warning(`${skippedRows} fila(s) incompletas no se enviaron.`);
      }
      toast.success("Lista guardada.", { id: tId });
    } catch (e) {
      toast.error(e.message || "Error al guardar.");
    }
  };

  const handleSyncMatch = async () => {
    if (isReadOnlyAccess) return;

    if (!selectedModelsIds.length || !selectedFolderId || !altProjectId) {
      toast.warning("Configura modelos y folder primero.");
      return;
    }
    setIsSyncing(true);
    const tId = toast.loading("Sincronizando con Autodesk...");
    try {
      const url = `${apiBase}/plans/${pId}/plans/match`;
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-alt-project-id": altProjectId,
          "selected-folder-id": selectedFolderId,
        },
        body: JSON.stringify({}),
      });
      const json = await safeJson(res, url);
      if (!res.ok) {
        throw new Error(getApiErrorMessage(json, "Error en sincronizacion."));
      }
      
      const reloadRes = await fetch(`${apiBase}/plans/${pId}/plans`, { credentials: "include" });
      const reloadJson = await safeJson(reloadRes, "reload");
      setPlans(reloadJson.data?.plans || []);
      await loadControlComments();

      await loadAlerts();

      toast.success("SincronizaciÃ³n completada.", { id: tId });
    } catch (e) {
      console.error(e);
      toast.error(e.message || "FallÃ³ la sincronizaciÃ³n.", { id: tId });
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoadingInitial || isSyncing) {
    return (
      <AppLayout>
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm animate-in fade-in duration-300">
          <AbitatLogoLoader className="scale-100" />
          <p className="mt-6 animate-pulse text-base font-medium text-gray-500">
            {isSyncing ? "Sincronizando datos con Autodesk..." : "Cargando planes..."}
          </p>
        </div>
      </AppLayout>
    );
  }

  const fetchAsDataURL = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`No pude cargar logo: ${url}`);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  };
  
  const loadLogo = async () => {
    const candidates = ["/ControlPlanos/Abitat_img.png", "/ControlPlanos/Abitat_img.jpg", "/ControlPlanos/Abitat_img.jpeg", "/ControlPlanos/Abitat_img.webp", "/Abitat_img.png"];
    for (const u of candidates) {
      try {
        return await fetchAsDataURL(u);
      } catch {
        continue;
      }
    }
    return null; 
  };


  const handleExportPDF = async () => {
    if (viewMode === "alerts") {
      toast.info("La vista de alertas no tiene exportacion PDF.");
      return;
    }

    const tId = toast.loading("Generando PDF...");
    setIsExportingPdf(true);

    try {
      if (viewMode === "dashboard" || viewMode === "tracking") {
        const captureTarget = viewMode === "dashboard" ? dashboardExportRef.current : trackingExportRef.current;
        if (!captureTarget) {
          throw new Error(
            viewMode === "dashboard"
              ? "No se pudo capturar el dashboard."
              : "No se pudo capturar la vista de seguimiento."
          );
        }
        const logo = await loadLogo();
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: TABLOID_LANDSCAPE_MM,
          compress: true,
        });

        const margin = 10;
        const headerTop = 11;
        const headerSpace = 15;
        const footerSpace = 6;
        const blockGap = 4;
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const contentX = margin;
        const contentY = margin + headerSpace;
        const contentW = pageW - margin * 2;
        const contentH = pageH - margin * 2 - headerSpace - footerSpace;
        const title = `Proyecto: ${projectName || "Proyecto"}`;
        const sub =
          viewMode === "dashboard"
            ? `Dashboard - ${new Date().toLocaleString("es-MX")}`
            : `Seguimiento - ${new Date().toLocaleString("es-MX")}`;

        const drawPageDecoration = (pageNumber, totalPages) => {
          let x = margin;
          if (logo) {
            pdf.addImage(logo, "PNG", margin, 7, 24, 10);
            x = margin + 28;
          }
          pdf.setFontSize(12);
          pdf.text(title, x, headerTop);
          pdf.setFontSize(9);
          pdf.text(sub, x, headerTop + 5);
          pdf.text(`Pagina ${pageNumber} de ${totalPages}`, pageW - margin, headerTop, { align: "right" });
          pdf.setDrawColor(220);
          pdf.line(margin, contentY - 3, pageW - margin, contentY - 3);
          pdf.line(margin, pageH - margin - footerSpace + 1, pageW - margin, pageH - margin - footerSpace + 1);
        };

        const waitForNextPaint = () =>
          new Promise((resolve) => {
            requestAnimationFrame(() => setTimeout(resolve, 80));
          });

        const renderBlockCanvas = async (block) => {
          await waitForNextPaint();
          return html2canvas(block, {
            backgroundColor: "#ffffff",
            scale: 2,
            useCORS: true,
            logging: false,
            scrollX: 0,
            scrollY: -window.scrollY,
            width: Math.max(block.scrollWidth || 0, block.clientWidth || 0),
            height: Math.max(block.scrollHeight || 0, block.clientHeight || 0),
            windowWidth: Math.max(document.documentElement.clientWidth, block.scrollWidth || block.clientWidth || 0),
            windowHeight: Math.max(document.documentElement.clientHeight, block.scrollHeight || block.clientHeight || 0),
          });
        };

        if (viewMode === "tracking") {
          const tableContainer =
            captureTarget.querySelector('[data-pdf-role="tracking-table"]') ||
            captureTarget.querySelector("[data-pdf-block]");
          const chartBlock = captureTarget.querySelector('[data-pdf-role="tracking-chart"]');
          if (!tableContainer) {
            throw new Error("No se encontro la tabla de seguimiento para exportar.");
          }

          const tableElement = tableContainer.querySelector("table") || tableContainer;
          const tableCanvas = await renderBlockCanvas(tableElement);
          if (!tableCanvas.width || !tableCanvas.height) {
            throw new Error("No se pudo renderizar la tabla de seguimiento.");
          }

          const tableImgData = tableCanvas.toDataURL("image/png");
          const tableRenderW = contentW;
          const tableRenderH = (tableCanvas.height * tableRenderW) / tableCanvas.width;
          let offsetY = 0;
          while (offsetY < tableRenderH) {
            if (offsetY > 0) {
              pdf.addPage();
            }
            pdf.addImage(
              tableImgData,
              "PNG",
              contentX,
              contentY - offsetY,
              tableRenderW,
              tableRenderH,
              undefined,
              "FAST"
            );
            offsetY += contentH;
          }

          if (chartBlock) {
            pdf.addPage();
            const chartCanvas = await renderBlockCanvas(chartBlock);
            if (chartCanvas.width && chartCanvas.height) {
              let chartRenderW = contentW;
              let chartRenderH = (chartCanvas.height * chartRenderW) / chartCanvas.width;
              if (chartRenderH > contentH) {
                const shrinkFactor = contentH / chartRenderH;
                chartRenderW *= shrinkFactor;
                chartRenderH *= shrinkFactor;
              }
              const chartX = contentX + (contentW - chartRenderW) / 2;
              const chartY = contentY + (contentH - chartRenderH) / 2;
              pdf.addImage(
                chartCanvas.toDataURL("image/png"),
                "PNG",
                chartX,
                chartY,
                chartRenderW,
                chartRenderH,
                undefined,
                "FAST"
              );
            }
          }

          const totalPages = pdf.getNumberOfPages();
          for (let page = 1; page <= totalPages; page += 1) {
            pdf.setPage(page);
            drawPageDecoration(page, totalPages);
          }

          pdf.save(`Seguimiento_${projectName || "Proyecto"}.pdf`);
          toast.success("PDF de seguimiento generado.", { id: tId });
          return;
        }

        await waitForNextPaint();
        const explicitBlocks = Array.from(captureTarget.querySelectorAll("[data-pdf-block]"));
        const fallbackRoot = captureTarget.firstElementChild;
        const fallbackBlocks = fallbackRoot
          ? Array.from(fallbackRoot.children).filter(
              (el) =>
                !el.hasAttribute("data-html2canvas-ignore") &&
                el.getBoundingClientRect().width > 0 &&
                el.getBoundingClientRect().height > 0
            )
          : [];

        const exportBlocks = (explicitBlocks.length
          ? explicitBlocks
          : fallbackBlocks.length
            ? fallbackBlocks
            : [captureTarget]
        ).filter(
          (el) =>
            !el.hasAttribute("data-html2canvas-ignore") &&
            el.getBoundingClientRect().width > 0 &&
            el.getBoundingClientRect().height > 0
        );

        if (exportBlocks.length === 0) {
          throw new Error("No se encontraron bloques para exportar.");
        }

        let cursorY = contentY;
        for (const block of exportBlocks) {
          const canvas = await renderBlockCanvas(block);
          if (!canvas.width || !canvas.height) continue;

          let renderW = contentW;
          let renderH = (canvas.height * renderW) / canvas.width;
          if (renderH > contentH) {
            const shrinkFactor = contentH / renderH;
            renderW *= shrinkFactor;
            renderH *= shrinkFactor;
          }

          if (cursorY !== contentY && cursorY + renderH > contentY + contentH) {
            pdf.addPage();
            cursorY = contentY;
          }

          const drawX = contentX + (contentW - renderW) / 2;
          pdf.addImage(canvas.toDataURL("image/png"), "PNG", drawX, cursorY, renderW, renderH, undefined, "FAST");
          cursorY += renderH + blockGap;
        }

        const totalPages = pdf.getNumberOfPages();
        for (let page = 1; page <= totalPages; page += 1) {
          pdf.setPage(page);
          drawPageDecoration(page, totalPages);
        }

        pdf.save(`Dashboard_${projectName || "Proyecto"}.pdf`);
        toast.success("PDF del dashboard generado.", { id: tId });
        return;
      }

      const logo = await loadLogo();
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: TABLOID_LANDSCAPE_MM,
        compress: true,
      });

      const margin = 10;
      const headerTop = 11;
      const title = `Proyecto: ${projectName || "Proyecto"}`;
      const sub =
        viewMode === "control"
          ? `Reporte de Control - ${new Date().toLocaleString("es-MX")}`
          : `Reporte de Planos - ${new Date().toLocaleString("es-MX")}`;

      const drawPdfHeader = () => {
        let x = margin;
        if (logo) {
          pdf.addImage(logo, "PNG", margin, 7, 24, 10);
          x = margin + 28;
        }
        pdf.setFontSize(12);
        pdf.text(title, x, headerTop);
        pdf.setFontSize(9);
        pdf.text(sub, x, headerTop + 5);
        const pageWInner = pdf.internal.pageSize.getWidth();
        pdf.text(`Pagina ${pdf.getNumberOfPages()}`, pageWInner - margin, headerTop, { align: "right" });
      };

      if (viewMode === "control") {
        const parseAnyDate = (value) => {
          if (!value) return null;
          if (value instanceof Date) {
            const d = new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12, 0, 0, 0);
            return Number.isNaN(d.getTime()) ? null : d;
          }
          const raw = String(value).trim();
          if (!raw) return null;
          const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (iso) {
            const [, y, m, d] = iso;
            const dt = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0, 0);
            return Number.isNaN(dt.getTime()) ? null : dt;
          }
          const dmy = raw.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
          if (dmy) {
            let [, d, m, y] = dmy;
            if (y.length === 2) y = `20${y}`;
            const dt = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0, 0);
            return Number.isNaN(dt.getTime()) ? null : dt;
          }
          const parsed = new Date(raw);
          if (Number.isNaN(parsed.getTime())) return null;
          return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 12, 0, 0, 0);
        };

        const formatDate = (value) => {
          const d = parseAnyDate(value);
          if (!d) return "-";
          const dd = String(d.getDate()).padStart(2, "0");
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const yyyy = d.getFullYear();
          return `${dd}/${mm}/${yyyy}`;
        };

        const monthNames = [
          "Enero",
          "Febrero",
          "Marzo",
          "Abril",
          "Mayo",
          "Junio",
          "Julio",
          "Agosto",
          "Septiembre",
          "Octubre",
          "Noviembre",
          "Diciembre",
        ];

        const startOfWeekMonday = (date) => {
          const d = new Date(date);
          const offset = (d.getDay() + 6) % 7;
          d.setDate(d.getDate() - offset);
          d.setHours(12, 0, 0, 0);
          return d;
        };

        const addDays = (date, days) => {
          const d = new Date(date);
          d.setDate(d.getDate() + days);
          return d;
        };

        const getFirst = (row, keys) => {
          for (const key of keys) {
            const value = row?.[key];
            if (value !== undefined && value !== null && String(value).trim() !== "") return value;
          }
          return "";
        };

        const controlRows = (plans || [])
          .filter((r) => (r.name || r.sheet_name || "").trim() || (r.number || r.sheet_number || "").trim())
          .map((r) => ({
            number: getFirst(r, ["number", "sheet_number"]),
            name: getFirst(r, ["name", "sheet_name"]),
            plannedGenDate: getFirst(r, ["plannedGenDate", "planned_gen_date"]),
            actualGenDate: getFirst(r, ["actualGenDate", "actual_gen_date"]),
            plannedReviewDate: getFirst(r, ["plannedReviewDate", "planned_review_date"]),
            actualReviewDate: getFirst(r, ["actualReviewDate", "actual_review_date"]),
            plannedIssueDate: getFirst(r, ["plannedIssueDate", "planned_issue_date"]),
            actualIssueDate: getFirst(r, ["actualIssueDate", "actual_issue_date"]),
          }));

        const allDates = [];
        for (const row of controlRows) {
          [
            row.plannedGenDate,
            row.actualGenDate,
            row.plannedReviewDate,
            row.actualReviewDate,
            row.plannedIssueDate,
            row.actualIssueDate,
          ].forEach((value) => {
            const d = parseAnyDate(value);
            if (d) allDates.push(d);
          });
        }

        const minDate = allDates.length ? new Date(Math.min(...allDates.map((d) => d.getTime()))) : new Date();
        const maxDate = allDates.length ? new Date(Math.max(...allDates.map((d) => d.getTime()))) : new Date();
        const startDate = startOfWeekMonday(minDate);
        const endDate = addDays(startOfWeekMonday(maxDate), 6);

        const weeks = [];
        let cursor = new Date(startDate);
        let weekNumber = 1;
        while (cursor.getTime() <= endDate.getTime()) {
          const start = new Date(cursor);
          const end = addDays(start, 6);
          weeks.push({ weekNumber, start, end });
          cursor = addDays(cursor, 7);
          weekNumber += 1;
        }

        const monthGroups = [];
        weeks.forEach((week) => {
          const key = `${week.start.getFullYear()}-${week.start.getMonth()}`;
          const last = monthGroups[monthGroups.length - 1];
          if (!last || last.key !== key) {
            monthGroups.push({
              key,
              name: monthNames[week.start.getMonth()],
              year: week.start.getFullYear(),
              count: 1,
            });
          } else {
            last.count += 1;
          }
        });

        const findWeekIndex = (value) => {
          const d = parseAnyDate(value);
          if (!d) return null;
          const idx = weeks.findIndex(
            (week) => d.getTime() >= week.start.getTime() && d.getTime() <= week.end.getTime()
          );
          return idx >= 0 ? idx : null;
        };

        const controlInfoExportColumns = [
          { id: "number", label: "N. Plano", getValue: (row) => row.number || "-", style: { cellWidth: 20 } },
          { id: "name", label: "Nombre", getValue: (row) => row.name || "-", style: { cellWidth: 40 } },
          { id: "plannedGenDate", label: "Gen. Prog.", getValue: (row) => formatDate(row.plannedGenDate), style: { cellWidth: 16, halign: "center" } },
          { id: "actualGenDate", label: "Gen. Real", getValue: (row) => formatDate(row.actualGenDate), style: { cellWidth: 16, halign: "center" } },
          { id: "plannedReviewDate", label: "Rev. Prog.", getValue: (row) => formatDate(row.plannedReviewDate), style: { cellWidth: 16, halign: "center" } },
          { id: "actualReviewDate", label: "Rev. Real", getValue: (row) => formatDate(row.actualReviewDate), style: { cellWidth: 16, halign: "center" } },
          { id: "plannedIssueDate", label: "Em. Prog.", getValue: (row) => formatDate(row.plannedIssueDate), style: { cellWidth: 16, halign: "center" } },
          { id: "actualIssueDate", label: "Em. Real", getValue: (row) => formatDate(row.actualIssueDate), style: { cellWidth: 16, halign: "center" } },
        ];

        const activeControlInfoColumns = controlInfoExportColumns.filter((col) =>
          visibleControlColumns.includes(col.id)
        );

        if (activeControlInfoColumns.length === 0) {
          toast.warning("No hay columnas visibles en Control para exportar.", { id: tId });
          return;
        }

        const fixedColumns = [
          { id: "index", label: "#", getValue: (_row, index) => index + 1, style: { cellWidth: 10, halign: "center" } },
          ...activeControlInfoColumns,
        ];

        const monthHeader = [
          {
            content: "Informacion del Plano",
            colSpan: fixedColumns.length,
            styles: { halign: "left", fillColor: [243, 244, 246] },
          },
          ...monthGroups.map((group) => ({
            content: `${group.name} ${group.year}`,
            colSpan: group.count,
            styles: { halign: "center", fillColor: [243, 244, 246] },
          })),
        ];

        const weekHeader = [
          ...fixedColumns.map((column) => ({ content: column.label, styles: { halign: "center" } })),
          ...weeks.map((week) => {
            const sdd = String(week.start.getDate()).padStart(2, "0");
            const smm = String(week.start.getMonth() + 1).padStart(2, "0");
            const edd = String(week.end.getDate()).padStart(2, "0");
            const emm = String(week.end.getMonth() + 1).padStart(2, "0");
            return { content: `S${week.weekNumber}\n${sdd}/${smm}-${edd}/${emm}`, styles: { halign: "center" } };
          }),
        ];

        const body = controlRows.map((row, index) => {
          const plannedWeek = findWeekIndex(row.plannedIssueDate);
          const actualWeek = findWeekIndex(row.actualIssueDate);
          const weekCells = weeks.map((_, idx) => {
            if (plannedWeek === idx && actualWeek === idx) return "X/X";
            if (plannedWeek === idx || actualWeek === idx) return "X";
            return "";
          });

          return [...fixedColumns.map((column) => column.getValue(row, index)), ...weekCells];
        });

        const safeBody = body.length ? body : [[...fixedColumns.map(() => "-"), ...weeks.map(() => "")]];
        const fixedCount = fixedColumns.length;
        const repeatCols = Array.from({ length: fixedCount }, (_, i) => i);
        const columnStyles = {};
        fixedColumns.forEach((column, idx) => {
          columnStyles[idx] = column.style;
        });
        weeks.forEach((_, idx) => {
          columnStyles[idx + fixedCount] = { cellWidth: 8, halign: "center" };
        });

        autoTable(pdf, {
          head: [monthHeader, weekHeader],
          body: safeBody,
          theme: "grid",
          margin: { left: margin, right: margin, top: headerTop + 12, bottom: margin },
          styles: {
            fontSize: 6,
            cellPadding: 1,
            overflow: "linebreak",
            valign: "middle",
          },
          headStyles: {
            fontStyle: "bold",
            textColor: [40, 40, 40],
          },
          columnStyles,
          horizontalPageBreak: true,
          horizontalPageBreakRepeat: repeatCols,
          didDrawPage: drawPdfHeader,
        });

        pdf.save(`Reporte_Control_${projectName || "Proyecto"}.pdf`);
        toast.success("PDF de control generado con calendario completo.", { id: tId });
        return;
      }

      const tableExportColumns = [
        { id: "index", label: "#", getValue: (_row, index) => index + 1 },
        { id: "specialty", label: "Especialidad", getValue: (row) => row.specialty || "" },
        { id: "number", label: "N. Plano", getValue: (row) => row.number || row.sheet_number || "" },
        { id: "name", label: "Nombre", getValue: (row) => row.name || row.sheet_name || "" },
        { id: "currentRevision", label: "Rev.", getValue: (row) => row.currentRevision || row.current_revision || "" },
        { id: "currentRevisionDate", label: "Fecha Rev.", getValue: (row) => fmtDMY(row.currentRevisionDate || row.current_revision_date || "") },
        { id: "plannedGenDate", label: "Gen. Programada", getValue: (row) => fmtDMY(row.plannedGenDate || row.planned_gen_date || "") },
        { id: "actualGenDate", label: "Gen. Real", getValue: (row) => fmtDMY(row.actualGenDate || row.actual_gen_date || "") },
        { id: "docsVersion", label: "Ver.", getValue: (row) => row.docsVersion || row.docs_version_number || "" },
        { id: "docsVersionDate", label: "Ult. Version", getValue: (row) => fmtDMY(row.docsVersionDate || row.docs_last_modified || "") },
        { id: "plannedReviewDate", label: "Rev. Programada", getValue: (row) => fmtDMY(row.plannedReviewDate || row.planned_review_date || "") },
        { id: "hasApprovalFlow", label: "Aprob.", getValue: (_row, _index, context) => context.approval },
        { id: "actualReviewDate", label: "Rev. Real", getValue: (row) => fmtDMY(row.actualReviewDate || row.actual_review_date || "") },
        { id: "lastReviewDate", label: "Ult. Flujo", getValue: (row) => fmtDMY(row.lastReviewDate || row.latest_review_date || "") },
        { id: "lastReviewStatus", label: "Estado Flujo", getValue: (row) => row.lastReviewStatus || row.latest_review_status || "-" },
        { id: "plannedIssueDate", label: "Emision Prog.", getValue: (row) => fmtDMY(row.plannedIssueDate || row.planned_issue_date || "") },
        { id: "actualIssueDate", label: "Emision Real", getValue: (row) => fmtDMY(row.actualIssueDate || row.actual_issue_date || "") },
        { id: "issueUpdatedAt", label: "Actualizado", getValue: (row) => fmtDMY(row.issueUpdatedAt || row.sheet_updated_at || "") },
        { id: "issueVersionSetName", label: "Conjunto", getValue: (row) => row.issueVersionSetName || row.sheet_version_set || "" },
        { id: "progress", label: "Progreso", getValue: (_row, _index, context) => `${context.progressLabel} (${context.pct}%)` },
      ];

      const activeTableColumns = tableExportColumns.filter((column) =>
        visibleTableColumns.includes(column.id)
      );

      if (activeTableColumns.length === 0) {
        toast.warning("No hay columnas visibles en Revision para exportar.", { id: tId });
        return;
      }

      const columns = activeTableColumns.map((column) => column.label);

      const rows = (plans || [])
        .filter((r) => (r.name || r.sheet_name || "").trim() || (r.number || r.sheet_number || "").trim())
        .map((r, i) => {
          const { pct, label: progressLabel } = getPlanProgressInfo(r);
          const approval = (r.hasApprovalFlow ?? r.has_approval_flow) ? "SI" : "-";
          const context = { pct, progressLabel, approval };

          return activeTableColumns.map((column) => column.getValue(r, i, context));
        });

      const safeRows = rows.length ? rows : [columns.map(() => "-")];
      autoTable(pdf, {
        head: [columns],
        body: safeRows,
        theme: "grid",
        margin: { left: margin, right: margin, top: headerTop + 12, bottom: margin },
        styles: {
          fontSize: 7,
          cellPadding: 1.2,
          overflow: "linebreak",
          valign: "middle",
        },
        headStyles: {
          fontStyle: "bold",
        },
        didDrawPage: drawPdfHeader,
      });

      pdf.save(`Reporte_Planos_${projectName || "Proyecto"}.pdf`);
      toast.success("PDF generado con exito.", { id: tId });
    } catch (e) {
      console.error(e);
      toast.error("Error al generar PDF.", { id: tId, description: e?.message });
    } finally {
      setIsExportingPdf(false);
    }
  };


  const getViewModeButtonClass = (isActive) =>
    `h-8 gap-2 text-xs transition-colors ${
      isActive
        ? "bg-zinc-900 text-white shadow-sm hover:bg-zinc-900 hover:text-white"
        : "text-muted-foreground hover:bg-zinc-900 hover:text-white"
    }`;

  return (
    <AppLayout>
      {/* Contenedor Principal de Reporte 
        - ref={reportRef}: Para saber quÃ© capturar.
        - bg-white: Fondo blanco para el PDF.
        - w-fit / min-w-full: Asegura que si la tabla es ancha, el contenedor crezca y no recorte.
      */}
      <div
        id="pdf-report-root"
        ref={reportRef}
        className="mx-auto max-w-[1800px] w-fit min-w-full space-y-6 p-6 bg-white"
      >
        <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Project Sheets</h1>
              <Badge variant="outline" className="gap-1 rounded-full border-primary/20 bg-primary/5 px-2 text-primary">
                <Sparkles className="h-3 w-3" /> V3.0
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {projectName ? `Proyecto: ${projectName}` : "GestiÃ³n y seguimiento de planos"}
            </p>
          </div>
           <div className="flex items-center gap-4">
              <div className="flex items-center rounded-lg border border-border bg-muted/50 p-1">
               <Button variant="ghost" size="sm" className={getViewModeButtonClass(viewMode === "table")} onClick={() => setViewMode("table")}>
                 <Table2 className="h-3.5 w-3.5" /> Revision
               </Button>
               <Button variant="ghost" size="sm" className={getViewModeButtonClass(viewMode === "control")} onClick={() => setViewMode("control")}>
                 <CalendarDays className="h-3.5 w-3.5" /> Control
               </Button>
               <Button variant="ghost" size="sm" className={getViewModeButtonClass(viewMode === "tracking")} onClick={() => setViewMode("tracking")}>
                 <Clock className="h-3.5 w-3.5" /> Seguimiento
               </Button>
               <Button variant="ghost" size="sm" className={getViewModeButtonClass(viewMode === "dashboard")} onClick={() => setViewMode("dashboard")}>
                 <BarChart3 className="h-3.5 w-3.5" /> Dashboard
               </Button>
              </div>
              {!isReadOnlyAccess && (
                <div className="flex items-center rounded-lg border border-border bg-muted/50 p-1">
                 <Button
                    variant="ghost"
                   size="sm"
                  className={getViewModeButtonClass(viewMode === "alerts")}
                   onClick={() => setViewMode("alerts")}
                 >
                  <AlertCircle className="h-3.5 w-3.5" />
                  Alertas
                  <Badge variant="secondary" className="ml-1 h-5 px-1 text-[10px]">{alerts.length}</Badge>
                </Button>
               </div>
              )}
           </div>
        </div>

        {viewMode === "dashboard" && (
          <div className="mt-2 flex justify-end" data-html2canvas-ignore="true">
            <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2" disabled={isExportingPdf}>
              <FileText className="h-4 w-4 text-red-600" />
              {isExportingPdf ? "Generando..." : "Descargar Reporte PDF"}
            </Button>
          </div>
        )}

        {viewMode === "table" ? (
          <>
            {/* data-html2canvas-ignore hace que esta barra NO salga en el PDF */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3" data-html2canvas-ignore="true">
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 bg-background shadow-sm hover:bg-zinc-50"
                        onClick={handleOpenModelsModal}
                        disabled={isReadOnlyAccess}
                      >
                        <Boxes className="h-4 w-4 text-zinc-500" />
                        <span className="hidden sm:inline">Modelos</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Seleccionar modelos BIM</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 bg-background shadow-sm hover:bg-zinc-50"
                        onClick={handleOpenFoldersModal}
                        disabled={isReadOnlyAccess}
                      >
                        <FolderOpen className="h-4 w-4 text-zinc-500" />
                        <span className="hidden sm:inline">Folder</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Seleccionar carpeta de publicaciÃ³n</TooltipContent>
                  </Tooltip>
                
                </TooltipProvider>
                
                <div className="mx-1 hidden h-6 w-px bg-border sm:block" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2 hover:bg-background" disabled={isReadOnlyAccess}>
                      <FileUp className="h-4 w-4 text-zinc-500" /> <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={handleClickImport} disabled={isReadOnlyAccess}><FileUp className="mr-2 h-4 w-4" /> Excel (.xlsx)</DropdownMenuItem>
                  </DropdownMenuContent>

                </DropdownMenu>
                <Button variant="ghost" size="sm" className="gap-2 hover:bg-background" onClick={handleExportExcel}><FileDown className="h-4 w-4 text-emerald-600" /></Button>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <Button variant="ghost" size="sm" className="gap-2 hover:bg-background" onClick={handleExportPDF} disabled={isExportingPdf}>
                                <FileText className="h-4 w-4 text-red-600" />
                             </Button>
                        </TooltipTrigger>
                        <TooltipContent>{isExportingPdf ? "Generando PDF..." : "Exportar PDF (Doble Carta)"}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
              
              </div>

              <div className="ml-auto flex items-center gap-2">
                 <Button variant="secondary" size="sm" onClick={handleAddRow} disabled={isReadOnlyAccess}><Plus className="w-3 h-3"/> Fila</Button>
                 <Button variant="outline" size="sm" onClick={handleSaveList} disabled={isReadOnlyAccess}><CheckCircle2 className="w-3 h-3" /> Enviar a DB</Button>
                 <Button size="sm" className="bg-[rgb(170,32,47)] text-white hover:bg-[rgb(150,28,42)]" onClick={handleSyncMatch} disabled={isSyncing || isReadOnlyAccess}><Zap className="w-3 h-3"/> Sincronizar</Button>
              </div>
              <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleFileChange} />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3" data-html2canvas-ignore="true">
              <Card className="border-emerald-100 bg-emerald-50/50 md:col-span-1">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-emerald-600/80">% Progreso en emision</p>
                      <p className="text-2xl font-bold text-emerald-700">{stats.processProgressPct.toFixed(2)}%</p>
                      <p className="mt-2 text-[10px] font-medium text-emerald-700">
                        {stats.total > 0
                          ? `Promedio del proceso en ${stats.total} planos`
                          : "Sin planos para calcular"}
                      </p>
                    </div>
                    <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-100 text-[10px] text-emerald-700">
                      % Progreso
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {error && <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700"><AlertCircle className="h-4 w-4" /> {error}</div>}

            <SheetsTable
              data={plans}
              isReadOnly={isReadOnlyAccess}
              onEdit={handleEdit}
              onDeleteRow={handleDeleteRow}
              onVisibleColumnsChange={setVisibleTableColumns}
            />
          </>
        ) : viewMode === "control" ? (
          <div className="bg-white p-4">
            <div className="mb-4 flex justify-end" data-html2canvas-ignore="true">
              <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2" disabled={isExportingPdf}>
                <FileText className="h-4 w-4 text-red-600" />
                {isExportingPdf ? "Generando..." : "Descargar Reporte PDF"}
              </Button>
            </div>
            <ControlTable
              data={plansForControl}
              isReadOnly={isReadOnlyAccess}
              onEdit={handleEdit}
              onCommentChange={handleControlCommentChange}
              onVisibleColumnsChange={setVisibleControlColumns}
            />
          </div>
        ) : viewMode === "tracking" ? (
          <div ref={trackingExportRef} className="bg-white p-4">
            <div className="mb-4 flex justify-end" data-html2canvas-ignore="true">
              <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2" disabled={isExportingPdf}>
                <FileText className="h-4 w-4 text-red-600" />
                {isExportingPdf ? "Generando..." : "Descargar Reporte PDF"}
              </Button>
            </div>
            <AnalyticsDashboard data={plans} summaryOnly />
            <div className="mt-6">
            <WeeklyTrackingTable
              data={plans}
              projectId={projectId || "global"}
              restrictionsByWeek={trackingRestrictionsByWeek}
              onRestrictionChange={handleTrackingRestrictionChange}
            />
            </div>
          </div>
        ) : viewMode === "alerts" ? (
          <div className="bg-white p-4">
            <AlertsTable data={alerts} />
          </div>
        ) : (
          <div ref={dashboardExportRef} className="bg-white p-4">
            <AnalyticsDashboard data={plans} hideOverview />
          </div>
        )}

        <SelectModelsModal
          models={models}
          open={modalModelsOpen}
          loading={loadingModels} 
          onClose={() => setModalModelsOpen(false)}
          onSave={async (ids) => {
            if (isReadOnlyAccess) return;

            const url = `${apiBase}/aec/${pId}/graphql-models/set-selection`;
          
            const modelMeta = (models || [])
              .filter((m) => ids.includes(m.id))
              .map((m) => ({
                id: m.id,
                name: m.name || m.displayName || m.title || m.fileName || "",
              }));

            try {
              const res = await fetch(url, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ modelIds: ids, modelMeta }),
              });
              const json = await safeJson(res, url);
              if (!res.ok || json?.success === false) {
                throw new Error(
                  getApiErrorMessage(json, "No se pudo guardar la seleccion de modelos.")
                );
              }

              setSelectedModelsIds(ids);
              setModalModelsOpen(false);
              toast.success("Seleccion de modelos guardada.");
            } catch (err) {
              console.error(err);
              toast.error(err.message || "No se pudo guardar la seleccion de modelos.");
            }
          }}
        />

        <SelectFolderModal
          open={modalFoldersOpen}
          loading={loadingTree}
          onClose={() => setModalFoldersOpen(false)}
          folderTree={folderTree}
          selectedFolderId={selectedFolderId}
          onSave={async (folderId) => {
            if (isReadOnlyAccess) return;

            const url = `${apiBase}/aec/${pId}/graphql-folders/set-selection`;
            try {
              const res = await fetch(url, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ folderId }),
              });
              const json = await safeJson(res, url);
              if (!res.ok || json?.success === false) {
                throw new Error(
                  getApiErrorMessage(json, "No se pudo guardar la carpeta seleccionada.")
                );
              }

              setSelectedFolderId(folderId);
              setModalFoldersOpen(false);
              toast.success("Carpeta guardada.");
            } catch (err) {
              console.error(err);
              toast.error(err.message || "No se pudo guardar la carpeta seleccionada.");
            }
          }}
        />
      </div>
    </AppLayout>
  );
}



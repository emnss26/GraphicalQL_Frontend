import React, { useEffect, useState, useRef, useMemo } from "react";
import { useCookies } from "react-cookie";
import { useParams } from "react-router-dom";
import { read, utils, writeFile } from "xlsx";

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger 
} from "@/components/ui/tooltip";

// Icons
import {
  Boxes, FolderOpen, FileUp, FileDown, Plus, RefreshCw, 
  LayoutGrid, CheckCircle2, Clock, AlertCircle, TrendingUp, 
  ChevronDown, Sparkles, Zap, Table2, BarChart3
} from "lucide-react";

import AppLayout from "@/components/general_component/AppLayout";
import SheetsTable from "@/components/aec_model_components/SheetsTable";
import AnalyticsDashboard from "@/components/general_component/AnalyticsDashboard"; // <--- IMPORTA EL NUEVO DASHBOARD
import SelectModelsModal from "../../components/aec_model_components/SelectModelModal";
import SelectFolderModal from "../../components/aec_model_components/SelectFolderModal";
import AbitatLogoLoader from "@/components/general_component/AbitatLogoLoader"; 

const backendUrl = import.meta.env.VITE_API_BACKEND_BASE_URL;

const emptyPlan = () => ({
  id: null,
  name: "",
  number: "",
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

export default function AECModelPlansPage() {
  const [cookies] = useCookies(["access_token"]);
  const { projectId } = useParams();
  const altProjectId = sessionStorage.getItem("altProjectId");
  const projectName = sessionStorage.getItem("projectName");

  // --- ESTADO PARA CONTROLAR LA VISTA (TABLA vs DASHBOARD) ---
  const [viewMode, setViewMode] = useState("table"); 

  const [models, setModels] = useState([]);
  const [selectedModelsIds, setSelectedModelsIds] = useState([]);
  const [folderTree, setFolderTree] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(null);

  const [plans, setPlans] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  const fileInputRef = useRef(null);
  const apiBase = (backendUrl || "").replace(/\/$/, "");
  const pId = encodeURIComponent(projectId || "");

  const safeJson = async (res, urlForMsg) => {
    const ctype = res.headers.get("content-type") || "";
    if (!ctype.includes("application/json")) {
      const txt = await res.text();
      throw new Error(`Respuesta no JSON (${res.status}). URL: ${urlForMsg}. Detalle: ${txt.slice(0, 200)}...`);
    }
    return res.json();
  };

  /* ... TUS HELPERS DE FECHAS SE MANTIENEN IGUALES ... */
  const norm = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
  const excelSerialToISO = (n) => {
    if (typeof n !== "number" || !isFinite(n)) return "";
    const base = new Date(Date.UTC(1899, 11, 30));
    base.setUTCDate(base.getUTCDate() + Math.floor(n));
    return base.toISOString().slice(0, 10);
  };
  const dmyToISO = (s) => {
    const m = String(s || "").trim().match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
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
      const mx = dmyToISO(s); if (mx) return mx;
      const d = new Date(s); return isNaN(d) ? "" : d.toISOString().slice(0, 10);
    }
    return "";
  };
  const isoToDMY = (iso) => {
    if (!iso) return "";
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return "";
    const [, y, mm, dd] = m;
    return `${dd}/${mm}/${y}`;
  };
  const isNombre = (h) => ["nombre de plano", "nombre", "sheet name", "title"].includes(norm(h));
  const isNumero = (h) => ["número de plano", "numero de plano", "número", "numero", "sheet number", "no.", "no"].includes(norm(h));
  const isGenProg = (h) => ["fecha gen. (programada)", "fecha de generación (programada)", "fecha de generacion (programada)", "planned generation date"].includes(norm(h));
  const isRevProg = (h) => ["rev. técnica (programada)", "revisión técnica (programada)", "revision tecnica (programada)", "planned review date"].includes(norm(h));
  const isEmiProg = (h) => ["emisión (programada)", "emision (programada)", "emisión a construcción (programada)", "planned issue date"].includes(norm(h));

  const stats = useMemo(() => {
    const total = plans.length;
    const completed = plans.filter((d) => d.actualIssueDate || d.actual_issue_date).length;
    const inReview = plans.filter((d) => 
        (d.actualReviewDate || d.actual_review_date) && 
        !(d.actualIssueDate || d.actual_issue_date)
    ).length;
    const pending = total - completed - inReview;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inReview, pending, completionRate };
  }, [plans]);

  // --- EFECTOS DE CARGA ---
  useEffect(() => {
    (async () => {
      try {
        const a = await fetch(`${apiBase}/aec/${pId}/graphql-folders/get-selection`, { credentials: "include" });
        const aj = await safeJson(a, `/aec/${pId}/graphql-folders/get-selection`);
        setSelectedFolderId(aj.data?.folderId || null);
      } catch {}
      try {
        const b = await fetch(`${apiBase}/aec/${pId}/graphql-models/get-selection`, { credentials: "include" });
        const bj = await safeJson(b, `/aec/${pId}/graphql-models/get-selection`);
        setSelectedModelsIds(bj.data?.modelIds || []);
      } catch {}
    })();
  }, [apiBase, pId]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${apiBase}/aec/${pId}/graphql-models`, { credentials: "include" });
        const j = await safeJson(r, `/aec/${pId}/graphql-models`);
        setModels(j.data?.models || []);
      } catch {}
    })();
  }, [apiBase, pId]);

  useEffect(() => {
    (async () => {
      if (folderModalOpen) {
        try {
          const r = await fetch(`${apiBase}/aec/${pId}/graphql-project-folders`, { credentials: "include" });
          const j = await safeJson(r, `/aec/${pId}/graphql-project-folders`);
          setFolderTree(j.data?.folderTree || []);
        } catch { setFolderTree([]); }
      } else { setFolderTree([]); }
    })();
  }, [folderModalOpen, apiBase, pId]);

  const loadPlans = async () => {
    try {
      const url = `${apiBase}/plans/${pId}/plans`;
      const res = await fetch(url, { credentials: "include" });
      const json = await safeJson(res, url);
      const loaded = json.data?.plans ?? [];
      if (loaded.length === 0) setPlans(Array.from({ length: 10 }, () => emptyPlan()));
      else setPlans(loaded);
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al cargar planes.");
      setPlans(Array.from({ length: 10 }, () => emptyPlan()));
    }
  };

  useEffect(() => {
    const init = async () => {
        setIsLoadingInitial(true);
        await loadPlans();
        setIsLoadingInitial(false);
    };
    init();
  }, [apiBase, pId]);

  const handleAddRow = () => setPlans((prev) => [...prev, emptyPlan()]);

  const handleDeleteRow = async (rowIndex) => {
    const row = plans[rowIndex];
    if (row?.id) {
      try {
        const url = `${apiBase}/plans/${pId}/plans/${row.id}`;
        const res = await fetch(url, { method: "DELETE", credentials: "include" });
        if (!res.ok) console.warn("DELETE falló");
      } catch (e) { console.warn("DELETE falló", e); }
    }
    setPlans((prev) => prev.filter((_, i) => i !== rowIndex));
  };

  const handleClickImport = () => fileInputRef.current?.click();
  
  const handleFileChange = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      const buf = await file.arrayBuffer();
      const wb = read(buf, { cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = utils.sheet_to_json(ws, { header: 1, raw: false });
      if (!rows.length) throw new Error("El archivo está vacío.");
      
      const headers = rows[0];
      let idxNombre = -1, idxNumero = -1, idxGen = -1, idxRev = -1, idxEmi = -1;
      headers.forEach((h, i) => {
        if (idxNombre === -1 && isNombre(h)) idxNombre = i;
        if (idxNumero === -1 && isNumero(h)) idxNumero = i;
        if (idxGen === -1 && isGenProg(h)) idxGen = i;
        if (idxRev === -1 && isRevProg(h)) idxRev = i;
        if (idxEmi === -1 && isEmiProg(h)) idxEmi = i;
      });

      if (idxNumero === -1 || idxNombre === -1) throw new Error("Faltan columnas requeridas.");

      const plansPayload = rows.slice(1).map((r) => {
          const name = String(r[idxNombre] ?? "").trim();
          const number = String(r[idxNumero] ?? "").trim();
          const plannedGenDate = idxGen >= 0 ? toISODate(r[idxGen]) : "";
          const plannedReviewDate = idxRev >= 0 ? toISODate(r[idxRev]) : "";
          const plannedIssueDate = idxEmi >= 0 ? toISODate(r[idxEmi]) : "";
          return { name, number, plannedGenDate, plannedReviewDate, plannedIssueDate };
        }).filter((p) => p.name || p.number);

      if (!plansPayload.length) throw new Error("No hay datos válidos.");

      const url = `${apiBase}/plans/${pId}/plans/import`;
      const res = await fetch(url, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plans: plansPayload }),
      });
      const data = await safeJson(res, url);
      if (!res.ok) throw new Error(data?.error || "Error importando.");

      e.target.value = "";
      await loadPlans();
      alert(`Importación completada.`);
    } catch (err) {
      console.error(err);
      alert(`Error al importar: ${err.message}`);
    }
  };

  const handleExportExcel = () => {
    // Usamos 'plans' directamente, que contiene TODOS los registros cargados
    const exportData = plans.map((r) => ({
      "Nombre de plano": r.name || "",
      "Número de plano": r.number || "",
      "Revisión Actual": r.currentRevision || "",
      "Fecha Rev. Actual": isoToDMY(r.currentRevisionDate || r.current_revision_date || ""),
      "Fecha gen. (programada)": isoToDMY(r.plannedGenDate || r.planned_gen_date || ""),
      "Fecha gen. (real)": isoToDMY(r.actualGenDate || r.actual_gen_date || ""),
      "Rev. técnica (programada)": isoToDMY(r.plannedReviewDate || r.planned_review_date || ""),
      "Rev. técnica (real)": isoToDMY(r.actualReviewDate || r.actual_review_date || ""),
      "Emisión (programada)": isoToDMY(r.plannedIssueDate || r.planned_issue_date || ""),
      "Emisión (real)": isoToDMY(r.actualIssueDate || r.actual_issue_date || ""),
      "Conjunto": r.issueVersionSetName || r.sheet_version_set || "",
      "Estado": r.status || ""
    }));

    const ws = utils.json_to_sheet(exportData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Planos");
    writeFile(wb, `Planos_${projectName || "Proyecto"}.xlsx`);
  };

  const handleEdit = async (rowIndex, field, value) => {
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
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      const json = await safeJson(res, url);
      if (!res.ok) throw new Error(json?.error);
    } catch (err) {
      console.error(err);
      loadPlans();
    }
  };

  const handleSaveList = async () => {
    try {
      if (plans.some((p) => p.id)) {
        alert("Ya existen filas guardadas."); return;
      }
      const payload = plans.filter((p) => p.name || p.number).map((p) => ({
          name: p.name, number: p.number,
          plannedGenDate: p.plannedGenDate || "",
          plannedReviewDate: p.plannedReviewDate || "",
          plannedIssueDate: p.plannedIssueDate || "",
      }));
      if (!payload.length) { alert("No hay datos para guardar."); return; }

      const url = `${apiBase}/plans/${pId}/plans/import`;
      const res = await fetch(url, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plans: payload }),
      });
      if (!res.ok) throw new Error("Error al guardar.");
      await loadPlans();
      alert("Lista guardada.");
    } catch (e) { alert(e.message); }
  };

  const handleSyncMatch = async () => {
    if (!selectedModelsIds.length || !selectedFolderId || !altProjectId) {
      alert("Configura modelos y folder primero."); return;
    }
    setIsSyncing(true);
    try {
      const url = `${apiBase}/plans/${pId}/plans/match`;
      const res = await fetch(url, {
        method: "POST", credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-alt-project-id": altProjectId,
          "selected-folder-id": selectedFolderId,
        },
        body: JSON.stringify({}),
      });
      const json = await safeJson(res, url);
      console.log("Sync Match Response:", json);
      if (!res.ok) throw new Error(json?.error);
      await loadPlans();
      alert("Sincronización completada.");
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const hasPersistedRows = Array.isArray(plans) && plans.some((p) => p.id);

  if (isLoadingInitial || isSyncing) {
    return (
        <AppLayout>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm z-50 animate-in fade-in duration-300">
                <AbitatLogoLoader className="scale-100" />
                <p className="mt-6 text-base text-gray-500 font-medium animate-pulse">
                    {isSyncing ? "Sincronizando datos con Autodesk..." : "Cargando planes..."}
                </p>
            </div>
        </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-[1800px] mx-auto p-6 space-y-6">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Project Sheets</h1>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1 rounded-full px-2">
                <Sparkles className="h-3 w-3" /> V2.0
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {projectName ? `Proyecto: ${projectName}` : "Gestión y seguimiento de planos"}
            </p>
          </div>

          {/* TOGGLE VISTA Y PILLS */}
          <div className="flex items-center gap-4">
            
            {/* TOGGLE BUTTONS */}
            <div className="flex items-center bg-muted/50 rounded-lg p-1 border border-border">
                <Button
                    variant={viewMode === "table" ? "default" : "ghost"}
                    size="sm"
                    className={`gap-2 h-8 text-xs ${viewMode === "table" ? "bg-white text-black shadow-sm" : "hover:bg-transparent text-muted-foreground"}`}
                    onClick={() => setViewMode("table")}
                >
                    <Table2 className="h-3.5 w-3.5" />
                    Tabla
                </Button>
                <Button
                    variant={viewMode === "dashboard" ? "default" : "ghost"}
                    size="sm"
                    className={`gap-2 h-8 text-xs ${viewMode === "dashboard" ? "bg-white text-black shadow-sm" : "hover:bg-transparent text-muted-foreground"}`}
                    onClick={() => setViewMode("dashboard")}
                >
                    <BarChart3 className="h-3.5 w-3.5" />
                    Dashboard
                </Button>
            </div>

            <div className="hidden lg:flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-medium border border-emerald-500/20">
                <CheckCircle2 className="h-3.5 w-3.5" /> {stats.completed} Completados
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-600 text-xs font-medium border border-blue-500/20">
                <Clock className="h-3.5 w-3.5" /> {stats.inReview} En revisión
                </div>
            </div>
          </div>
        </div>

        {/* --- CONTENIDO CONDICIONAL --- */}
        {viewMode === "table" ? (
            <>
                {/* ACTION TOOLBAR (Solo visible en modo Tabla) */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/30 p-3 rounded-xl border border-border">
                    <div className="flex items-center gap-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-2 bg-background shadow-sm hover:bg-zinc-50" onClick={() => setModalOpen(true)}>
                                        <Boxes className="h-4 w-4 text-zinc-500" />
                                        <span className="hidden sm:inline">Modelos</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Seleccionar modelos BIM</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-2 bg-background shadow-sm hover:bg-zinc-50" onClick={() => setFolderModalOpen(true)}>
                                        <FolderOpen className="h-4 w-4 text-zinc-500" />
                                        <span className="hidden sm:inline">Folder</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Seleccionar carpeta de publicación</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        
                        <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="gap-2 hover:bg-background">
                                    <FileUp className="h-4 w-4 text-zinc-500" />
                                    <span className="hidden sm:inline">Importar</span>
                                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuItem onClick={handleClickImport}>
                                    <FileUp className="h-4 w-4 mr-2" /> Excel (.xlsx)
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button variant="ghost" size="sm" className="gap-2 hover:bg-background" onClick={handleExportExcel}>
                            <FileDown className="h-4 w-4 text-emerald-600" />
                            <span className="hidden sm:inline">Exportar</span>
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                        <Button variant="secondary" size="sm" className="gap-2 text-xs h-9" onClick={handleAddRow}>
                            <Plus className="h-3.5 w-3.5" /> Fila
                        </Button>
                        
                        {!hasPersistedRows && (
                            <Button variant="outline" size="sm" className="text-xs h-9" onClick={handleSaveList}>
                                Guardar Todo
                            </Button>
                        )}

                        <Button 
                            size="sm" 
                            className="gap-2 bg-[rgb(170,32,47)] hover:bg-[rgb(150,28,42)] text-white shadow-sm h-9 text-xs disabled:opacity-70 transition-all"
                            onClick={handleSyncMatch}
                            disabled={!selectedModelsIds.length || !selectedFolderId || !altProjectId || isSyncing}
                        >
                            <Zap className="h-3.5 w-3.5" /> Sincronizar
                        </Button>
                    </div>
                    <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
                </div>

                {error && (
                    <div className="p-4 rounded-lg bg-red-50 text-red-700 text-sm font-medium border border-red-100 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" /> {error}
                    </div>
                )}

                {/* TABLA */}
                <SheetsTable data={plans} onEdit={handleEdit} onDeleteRow={handleDeleteRow} />
            </>
        ) : (
            // VISTA DASHBOARD
            <AnalyticsDashboard data={plans} />
        )}

        {/* Modales */}
        <SelectModelsModal
          models={models}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={async (ids) => {
            const url = `${apiBase}/aec/${pId}/graphql-models/set-selection`;
            await fetch(url, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ modelIds: ids }) });
            setSelectedModelsIds(ids); setModalOpen(false);
          }}
        />
        <SelectFolderModal
          open={folderModalOpen}
          onClose={() => setFolderModalOpen(false)}
          folderTree={folderTree}
          onSave={async (folderId) => {
            const url = `${apiBase}/aec/${pId}/graphql-folders/set-selection`;
            await fetch(url, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folderId }) });
            setSelectedFolderId(folderId); setFolderModalOpen(false);
          }}
          selectedFolderId={selectedFolderId}
        />
      </div>
    </AppLayout>
  );
}
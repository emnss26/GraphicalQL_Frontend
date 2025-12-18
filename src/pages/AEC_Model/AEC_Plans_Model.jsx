import React, { useEffect, useState, useRef } from "react";
import { useCookies } from "react-cookie";
import { useParams } from "react-router-dom";
import { read, utils, writeFile } from "xlsx";

import { Button } from "@/components/ui/button";
import AppLayout from "@/components/general_component/AppLayout";
import SheetsTable from "@/components/aec_model_components/SheetsTable";
import SelectModelsModal from "../../components/aec_model_components/SelectModelModal";
import SelectFolderModal from "../../components/aec_model_components/SelectFolderModal";


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
  hasApprovalFlow: false,   // <-- NUEVO (read-only en la UI)
  status: "",
});

export default function AECModelPlansPage() {
  const [cookies] = useCookies(["access_token"]);
  const { projectId } = useParams();
  const altProjectId = sessionStorage.getItem("altProjectId");
  const projectName = sessionStorage.getItem("projectName");

  const [models, setModels] = useState([]);
  const [selectedModelsIds, setSelectedModelsIds] = useState([]);
  const [folderTree, setFolderTree] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(null);

  const [plans, setPlans] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  // helpers URL / JSON seguros
  const apiBase = (backendUrl || "").replace(/\/$/, "");
  const pId = encodeURIComponent(projectId || "");

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

  /** =======================
   *  Normalización de fechas
   *  ======================= */

  const norm = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");

  // Serial de Excel -> ISO (YYYY-MM-DD). Base 1899-12-30.
  const excelSerialToISO = (n) => {
    if (typeof n !== "number" || !isFinite(n)) return "";
    const base = new Date(Date.UTC(1899, 11, 30));
    base.setUTCDate(base.getUTCDate() + Math.floor(n));
    return base.toISOString().slice(0, 10);
  };

  // dd/mm/aaaa (o dd-mm-aaaa / dd.mm.aaaa) -> ISO
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

  // Cualquier valor -> ISO
  const toISODate = (v) => {
    if (!v && v !== 0) return "";
    if (v instanceof Date) return isNaN(v) ? "" : v.toISOString().slice(0, 10);
    if (typeof v === "number") return excelSerialToISO(v);
    if (typeof v === "string") {
      const s = v.trim();
      if (!s) return "";
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s; // ya ISO
      const mx = dmyToISO(s); if (mx) return mx;
      const d = new Date(s); return isNaN(d) ? "" : d.toISOString().slice(0, 10);
    }
    return "";
  };

  // ISO -> dd/mm/aaaa (para export MX)
  const isoToDMY = (iso) => {
    if (!iso) return "";
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return "";
    const [, y, mm, dd] = m;
    return `${dd}/${mm}/${y}`;
  };

  // detectar encabezados
  const isNombre = (h) =>
    ["nombre de plano", "nombre", "sheet name", "title"].includes(norm(h));
  const isNumero = (h) =>
    ["número de plano", "numero de plano", "número", "numero", "sheet number", "no.", "no"].includes(norm(h));
  const isGenProg = (h) =>
    [
      "fecha gen. (programada)",
      "fecha de generación (programada)",
      "fecha de generacion (programada)",
      "fecha de generación programada",
      "fecha de generacion programada",
      "planned generation date",
    ].includes(norm(h));
  const isRevProg = (h) =>
    [
      "rev. técnica (programada)",
      "revisión técnica (programada)",
      "revision tecnica (programada)",
      "planned review date",
    ].includes(norm(h));
  const isEmiProg = (h) =>
    [
      "emisión (programada)",
      "emision (programada)",
      "emisión a construcción (programada)",
      "emision a construccion (programada)",
      "planned issue date",
    ].includes(norm(h));

  // cargar selección persistida (para match)
  useEffect(() => {
    (async () => {
      try {
        const a = await fetch(`${apiBase}/aec/${pId}/graphql-folders/get-selection`, {
          credentials: "include",
        });
        const aj = await safeJson(a, `/aec/${pId}/graphql-folders/get-selection`);
        setSelectedFolderId(aj.data?.folderId || null);
      } catch {}
      try {
        const b = await fetch(`${apiBase}/aec/${pId}/graphql-models/get-selection`, {
          credentials: "include",
        });
        const bj = await safeJson(b, `/aec/${pId}/graphql-models/get-selection`);
        setSelectedModelsIds(bj.data?.modelIds || []);
      } catch {}
    })();
  }, [apiBase, pId]);

  // modelos (para modal)
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${apiBase}/aec/${pId}/graphql-models`, {
          credentials: "include",
        });
        const j = await safeJson(r, `/aec/${pId}/graphql-models`);
        setModels(j.data?.models || []);
      } catch {}
    })();
  }, [apiBase, pId]);


  // folder tree al abrir
  useEffect(() => {
    (async () => {
      if (folderModalOpen) {
        try {
          const r = await fetch(`${apiBase}/aec/${pId}/graphql-project-folders`, {
            credentials: "include",
          });
          const j = await safeJson(r, `/aec/${pId}/graphql-project-folders`);
          setFolderTree(j.data?.folderTree || []);
        } catch {
          setFolderTree([]);
        }
      } else {
        setFolderTree([]);
      }
    })();
  }, [folderModalOpen, apiBase, pId]);

  // cargar planes desde DB
  const loadPlans = async () => {
  try {
    const url = `${apiBase}/plans/${pId}/plans`;
    const res = await fetch(url, { credentials: "include" });
    const json = await safeJson(res, url);
    const loaded = json.data?.plans ?? [];
    if (loaded.length === 0) {
      setPlans(Array.from({ length: 10 }, () => emptyPlan()));
    } else {
      setPlans(loaded);
    }
    setError("");
  } catch (err) {
    console.error(err);
    setError(err.message || "Error al cargar planes.");
    setPlans(Array.from({ length: 10 }, () => emptyPlan()));
  }
};
  useEffect(() => {
    loadPlans();
  }, [apiBase, pId]);

  // agregar/eliminar fila
  const handleAddRow = () => setPlans((prev) => [...prev, emptyPlan()]);

  const handleDeleteRow = async (rowIndex) => {
    const row = plans[rowIndex];
    if (row?.id) {
      try {
        const url = `${apiBase}/plans/${pId}/plans/${row.id}`;
        const res = await fetch(url, { method: "DELETE", credentials: "include" });
        if (!res.ok) console.warn("DELETE no disponible aún; se elimina localmente.");
      } catch (e) {
        console.warn("DELETE falló; se elimina localmente.", e);
      }
    }
    setPlans((prev) => prev.filter((_, i) => i !== rowIndex));
  };

  // importar excel (nombre, número y 3 fechas programadas)
  const handleClickImport = () => fileInputRef.current?.click();
  const handleFileChange = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      const buf = await file.arrayBuffer();
      // importante: cellDates true para obtener Date cuando es posible
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

      if (idxNumero === -1 || idxNombre === -1) {
        throw new Error("Encabezados mínimos: 'Nombre de plano' y 'Número de plano'.");
      }

      const plansPayload = rows.slice(1)
        .map((r) => {
          const name = String(r[idxNombre] ?? "").trim();
          const number = String(r[idxNumero] ?? "").trim();
          const plannedGenDate = idxGen >= 0 ? toISODate(r[idxGen]) : "";
          const plannedReviewDate = idxRev >= 0 ? toISODate(r[idxRev]) : "";
          const plannedIssueDate = idxEmi >= 0 ? toISODate(r[idxEmi]) : "";
          return { name, number, plannedGenDate, plannedReviewDate, plannedIssueDate };
        })
        .filter((p) => p.name || p.number);

      console.log("Parsed plans from Excel:", plansPayload);

      if (!plansPayload.length) throw new Error("No se encontraron datos de planos.");

      const url = `${apiBase}/plans/${pId}/plans/import`;
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plans: plansPayload }),
      });
      const data = await safeJson(res, url);
      if (!res.ok) throw new Error(data?.error || "Error importando planos.");

      e.target.value = "";
      await loadPlans();
      alert(`Importación completada: ${plansPayload.length} planos cargados.`);
    } catch (err) {
      console.error(err);
      alert(`Error al importar: ${err.message}`);
    }
  };

  // exportar excel (formato MX dd/mm/aaaa en las fechas)
  const handleExportExcel = () => {
    const exportData = (plans || []).map((r) => ({
      "Nombre de plano": r.name || "",
      "Número de plano": r.number || "",
      "Fecha gen. (programada)": isoToDMY(r.plannedGenDate || r.planned_gen_date || ""),
      "Rev. técnica (programada)": isoToDMY(r.plannedReviewDate || r.planned_review_date || ""),
      "Emisión (programada)": isoToDMY(r.plannedIssueDate || r.planned_issue_date || ""),
    }));
    const ws = utils.json_to_sheet(exportData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Planos");
    const safeName = String(projectId || "project").replace(/[^\w.-]+/g, "_");
    writeFile(wb, `Planos_${safeName}.xlsx`);
  };

  // guardar por celda (solo filas con id)
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
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      const json = await safeJson(res, url);
      if (!res.ok) throw new Error(json?.error || "No se pudo guardar el cambio.");
    } catch (err) {
      console.error(err);
      alert(`Error al guardar: ${err.message}`);
      loadPlans();
    }
  };

  // Guardar lista inicial
  const handleSaveList = async () => {
    try {
      if (plans.some((p) => p.id)) {
        alert("Ya existen filas guardadas. Edita por celda o agrega nuevas desde backend.");
        return;
      }
      const payload = plans
        .filter((p) => p.name || p.number)
        .map((p) => ({
          name: p.name,
          number: p.number,
          plannedGenDate: p.plannedGenDate || "",
          plannedReviewDate: p.plannedReviewDate || "",
          plannedIssueDate: p.plannedIssueDate || "",
        }));

      if (!payload.length) {
        alert("No hay filas con Número o Nombre para guardar.");
        return;
      }

      const url = `${apiBase}/plans/${pId}/plans/import`;
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plans: payload }),
      });
      const json = await safeJson(res, url);
      if (!res.ok) throw new Error(json?.error || "Error al guardar la lista.");
      await loadPlans();
      alert("Lista guardada. Ya puedes editar celdas y se guardarán automáticamente.");
    } catch (e) {
      console.error(e);
      alert(e.message);
    }
  };

  // match AEC/ACC (cuando el backend esté listo)
  const handleSyncMatch = async () => {
    if (!selectedModelsIds.length || !selectedFolderId || !altProjectId) {
      alert("Selecciona modelos y folder de planos para sincronizar con AEC/ACC.");
      return;
    }
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
      console.log("Sync response:", json);
      if (!res.ok) throw new Error(json?.error || "Error al sincronizar.");
      await loadPlans();
      alert("Sincronización con AEC/ACC completada.");
    } catch (e) {
      console.error(e);
      alert(e.message);
    }
  };

  const hasPersistedRows = Array.isArray(plans) && plans.some((p) => p.id);

  console.log("Models IDs selected:", selectedModelsIds);
  console.log("Folder ID selected:", selectedFolderId);
  console.log("Plans loaded:", plans);

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight justify-left">Project Sheets</h2>
          {projectName && (
            <span className="text-sm text-neutral-600 ">Proyecto: {projectName}</span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button className="bg-[rgb(170,32,47)] hover:bg-[rgb(150,28,42)] text-white h-10 px-4" onClick={() => setModalOpen(true)}>
            Seleccionar modelos
          </Button>
          <Button className="bg-[rgb(170,32,47)] hover:bg-[rgb(150,28,42)] text-white h-10 px-4" onClick={() => setFolderModalOpen(true)}>
            Seleccionar folder de planos
          </Button>

          <Button className="bg-[rgb(170,32,47)] hover:bg-[rgb(150,28,42)] text-white h-10 px-4" onClick={handleClickImport}>
            Importar desde Excel
          </Button>
          <Button className="bg-[rgb(170,32,47)] hover:bg-[rgb(150,28,42)] text-white h-10 px-4" onClick={handleExportExcel}>
            Exportar a Excel
          </Button>

          <Button className="bg-[rgb(170,32,47)] hover:bg-[rgb(150,28,42)] text-white h-10 px-4" onClick={handleAddRow}>
            Agregar fila
          </Button>

          {!hasPersistedRows && (
            <Button className="bg-[rgb(170,32,47)] hover:bg-[rgb(150,28,42)] text-white h-10 px-4" onClick={handleSaveList} title="Guarda las filas nuevas en la base">
              Guardar lista
            </Button>
          )}

          <Button
            className="bg-[rgb(170,32,47)] hover:bg-[rgb(150,28,42)] text-white h-10 px-4 disabled:opacity-50"
            onClick={handleSyncMatch}
            title="Cruzar con AEC/ACC"
            disabled={!selectedModelsIds.length || !selectedFolderId || !altProjectId}
          >
            Sincronizar con AEC/ACC
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {error && <div className="text-red-600 font-semibold">{error}</div>}

        <SheetsTable data={plans} onEdit={handleEdit} onDeleteRow={handleDeleteRow} />

        {/* Modales */}
        <SelectModelsModal
          models={models}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={async (ids) => {
            const url = `${apiBase}/aec/${pId}/graphql-models/set-selection`;
            await fetch(url, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ modelIds: ids }),
            });
            setSelectedModelsIds(ids);
            setModalOpen(false);
          }}
        />
        <SelectFolderModal
          open={folderModalOpen}
          onClose={() => setFolderModalOpen(false)}
          folderTree={folderTree}
          onSave={async (folderId) => {
            const url = `${apiBase}/aec/${pId}/graphql-folders/set-selection`;
            await fetch(url, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ folderId }),
            });
            setSelectedFolderId(folderId);
            setFolderModalOpen(false);
          }}
          selectedFolderId={selectedFolderId}
        />
      </div>
    </AppLayout>
  );
}

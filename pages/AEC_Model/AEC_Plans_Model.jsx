import React, { useEffect, useState, useRef  } from "react";
import { useCookies } from "react-cookie";
import { useParams } from "react-router-dom";
import { read, utils, writeFile } from "xlsx";

import { Button } from "@/components/ui/button";
import MainLayout from "@/components/general_component/MainLayout";
import SheetsTable from "@/components/aec_model_components/SheetsTable";
import SelectModelsModal from "../../src/components/aec_model_components/SelectModelModal";
import SelectFolderModal from "../../src/components/aec_model_components/SelectFolderModal";

const backendUrl = import.meta.env.VITE_API_BACKEND_BASE_URL;

export default function AECModelPlansPage() {
  const [cookies] = useCookies(["access_token"]);
  const { projectId } = useParams();
  const altProjectId = sessionStorage.getItem('altProjectId');

  const [models, setModels] = useState([]);
  const [selectedModelsIds, setSelectedModelsIds] = useState([]); 
  
  const [topFolders, setTopFolders] = useState([]);
  const [subFolders, setSubFolders] = useState([]);
  const [folderFiles, setFolderFiles] = useState([]);
  
  const [plans, setPlans] = useState([]);
  
  const [sheets, setSheets] = useState([]);
  const [sheetRows, setSheetRows] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folderTree, setFolderTree] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  
  const [error, setError] = useState("");

  //Cons excel
  const fileInputRef = useRef(null);

  //Helpers xlsl
  const norm = (s) =>
    String(s || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  const isHeaderNumero = (h) =>
    ["numero de plano", "número de plano", "numero", "número", "sheet number", "no.", "no"].includes(
      norm(h)
    );

  const isHeaderNombre = (h) =>
    ["nombre de plano", "nombre", "sheet name", "title"].includes(norm(h));

  useEffect(() => {
    fetch(`${backendUrl}/aec/${projectId}/graphql-folders/get-selection`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setSelectedFolderId(d.folderId || null))
      .catch(() => {});
    fetch(`${backendUrl}/aec/${projectId}/graphql-models/get-selection`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setSelectedModelsIds(d.modelIds || []))
      .catch(() => {});
  }, [projectId]);

  // Traer el folder seleccionado de la BD
  useEffect(() => {
    fetch(`${backendUrl}/aec/${projectId}/graphql-folders/get-selection`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => setSelectedFolderId(data.folderId || null));
  }, [projectId]);

  // Traer modelos seleccionados de la BD
  useEffect(() => {
    fetch(`${backendUrl}/aec/${projectId}/graphql-models/get-selection`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => setSelectedModelsIds(data.modelIds || []));
  }, [projectId]);

  // Traer todos los modelos posibles (para el modal)
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch(`${backendUrl}/aec/${projectId}/graphql-models`, {
          credentials: "include",
        });
        const result = await response.json();
        setModels(result.data?.models || []);
        setError("");
      } catch (err) {
        setError("Failed to fetch models.");
        console.error(err);
      }
    };
    fetchModels();
  }, [projectId]);

  // Traer el árbol de folders sólo cuando abres el modal
  useEffect(() => {
    if (folderModalOpen && !folderTree.length) {
      fetch(`${backendUrl}/aec/${projectId}/graphql-project-folders`, {
        credentials: "include"
      })
        .then(res => res.json())
        .then(data => setFolderTree(data.data?.folderTree || []));
    }
    // Cuando cierras el modal, limpia el árbol para evitar duplicados si cambias de proyecto
    if (!folderModalOpen) setFolderTree([]);
  }, [folderModalOpen, projectId]);

  // Traer hojas y archivos SÓLO cuando hay modelos seleccionados y folder seleccionado
  useEffect(() => {
    if (
      !projectId ||
      !altProjectId ||
      !selectedFolderId ||
      !selectedModelsIds.length
    ) {
      setSheets([]);
      setFolderFiles([]);
      setSheetRows([]);
      return;
    }
    const fetchSheetsAndFiles = async () => {
      try {
        const response = await fetch(`${backendUrl}/aec/${projectId}/graphql-project-plans`, {
          credentials: "include",
          headers: {
            "x-alt-project-id": altProjectId,
            "selected-folder-id": selectedFolderId
          }
        });
        const result = await response.json();
        if (!result.data) {
          setError(result.error || "Error desconocido");
          setSheets([]);
          setFolderFiles([]);
          setSheetRows([]);
          return;
        }
        setTopFolders(result.data.topFolders || []);
        setSubFolders(result.data.subFolders || []);
        setFolderFiles(result.data.files || []);
        setSheets(result.data.sheets || []);
        setError("");
      } catch (err) {
        setError("Failed to fetch sheets.");
        setSheets([]);
        setFolderFiles([]);
        setSheetRows([]);
        console.error(err);
      }
    };
    fetchSheetsAndFiles();
  }, [projectId, altProjectId, selectedFolderId, selectedModelsIds]);

  // Construir las filas de la tabla
  useEffect(() => {
    if (!sheets?.length) {
      setSheetRows([]);
      return;
    }
    const fileNames = (folderFiles || []).map((f) =>
      f.attributes?.displayName?.toLowerCase() || ""
    );
    const rows = sheets.map((sheet) => {
      const props = sheet.properties?.results || [];
      const name =
        props.find((p) => p.name === "Sheet Name")?.value || sheet.name || "";
      const number = props.find((p) => p.name === "Sheet Number")?.value || "";
      const currentRevision = props.find((p) => p.name === "Current Revision")?.value;
      const currentRevisionDesc = props.find((p) => p.name === "Current Revision Description")?.value;
      const currentRevisionDate = props.find((p) => p.name === "Current Revision Date")?.value;
      const inAcc = fileNames.some(
        (fn) =>
          fn.includes(number.toLowerCase()) && fn.includes(name.toLowerCase())
      );
      return {
        name,
        number,
        currentRevision,
        currentRevisionDesc,
        currentRevisionDate,
        inAcc,
      };
    });
    setSheetRows(rows);
  }, [sheets, folderFiles]);

  // LOG
  useEffect(() => {
    console.log({ models, selectedModelsIds, selectedFolderId, topFolders, subFolders, folderFiles, error });
  }, [models, selectedModelsIds, selectedFolderId, topFolders, subFolders, folderFiles, error]);

  // >>> NUEVO: cargar planes desde DB
  const loadPlans = async () => {
    try {
      const res = await fetch(`${backendUrl}/aec/${projectId}/plans`, {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Error al cargar planes.");
      // Espera un array [{id, name, number, ...}]
      setPlans(json.plans || json.data || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al cargar planes.");
      setPlans([]);
    }
  };

  useEffect(() => {
    loadPlans();
  }, [projectId]);
  
  

  const handleClickImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      const buf = await file.arrayBuffer();
      const wb = read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = utils.sheet_to_json(ws, { header: 1 }); // matriz [ [h1,h2], [v1,v2], ... ]
      if (!rows.length) throw new Error("El archivo está vacío.");

      // Detectar encabezados:
      const headers = rows[0];
      let idxNumero = -1;
      let idxNombre = -1;
      headers.forEach((h, i) => {
        if (idxNumero === -1 && isHeaderNumero(h)) idxNumero = i;
        if (idxNombre === -1 && isHeaderNombre(h)) idxNombre = i;
      });

      if (idxNumero === -1 || idxNombre === -1) {
        throw new Error(
          "No encontré encabezados válidos. Esperaba columnas 'Número de plano' y 'Nombre de plano' (o equivalentes)."
        );
      }

      // Mapear filas a objetos { number, name }
      const plans = rows.slice(1).map((r) => ({
        number: String(r[idxNumero] ?? "").trim(),
        name: String(r[idxNombre] ?? "").trim(),
      }));

      // Filtrar vacíos
      const cleanPlans = plans.filter((p) => p.number || p.name);
      if (!cleanPlans.length) throw new Error("No se encontraron datos de planos en el Excel.");

      // POST al backend
      const res = await fetch(`${backendUrl}/aec/${projectId}/plans/import`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plans: cleanPlans }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error importando planos.");

      alert(`Importación completada: ${cleanPlans.length} planos cargados.`);
      // Limpia el input para permitir reimportar el mismo archivo si se desea
      e.target.value = "";
      // (Opcional) refrescar algo si el backend devuelve conteo/estado…
    } catch (err) {
      console.error(err);
      alert(`Error al importar: ${err.message}`);
    }
  };

  const handleExportExcel = () => {
    // Exporta lo que se ve actualmente en la tabla (sheetRows)
    const exportData = (sheetRows || []).map((r) => ({
      "Número de plano": r.number || "",
      "Nombre de plano": r.name || "",
      "Revisión actual": r.currentRevision ?? "",
      "Fecha de revisión actual": r.currentRevisionDate ?? "",
      "Existe en ACC": r.inAcc ? "Sí" : "No",
    }));
    const ws = utils.json_to_sheet(exportData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Planos");
    writeFile(wb, `Planos_${projectId}.xlsx`);
  };

  // Si falta seleccionar modelos o folder, mostrar aviso
  if (!selectedModelsIds.length || !selectedFolderId) {
    return (
      <MainLayout>
        <div className="p-10 text-lg text-center text-gray-500">
          <div className="mb-4">
            <b>Debes seleccionar modelos y folder de planos para visualizar las hojas del proyecto.</b>
          </div>
          <div className="flex gap-3 justify-center">
            <Button
              className="bg-[rgb(170,32,47)] text-white"
              onClick={() => setModalOpen(true)}
            >
              Seleccionar modelos para analizar
            </Button>
            <Button
              className="bg-[rgb(170,32,47)] text-white"
              onClick={() => setFolderModalOpen(true)}
            >
              Seleccionar folder de planos
            </Button>

            {/* +++ NUEVOS BOTONES (deshabilitados si no hay selección, opcional) */}
            <Button
              variant="outline"
              onClick={handleClickImport}
              disabled={false}
              title="Importar desde Excel"
            >
              Importar desde Excel
            </Button>
            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={false}
              title="Exportar a Excel"
            >
              Exportar a Excel
            </Button>
            {/* input file oculto */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <SelectModelsModal
            models={models}
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onSave={async (selectedModelIds) => {
              await fetch(`${backendUrl}/aec/${projectId}/graphql-models/set-selection`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ modelIds: selectedModelIds }),
              });
              setSelectedModelsIds(selectedModelIds);
              setModalOpen(false);
            }}
          />
          <SelectFolderModal
            open={folderModalOpen}
            onClose={() => setFolderModalOpen(false)}
            folderTree={folderTree}
            onSave={async (folderId) => {
              await fetch(`${backendUrl}/aec/${projectId}/graphql-folders/set-selection`, {
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
      </MainLayout>
    );
  }

  const handleEdit = async (rowIndex, field, value) => {
    try {
      const planId = plans[rowIndex]?.id;
      if (!planId) return;
      setPlans((prev) => {
        const clone = [...prev];
        clone[rowIndex] = { ...clone[rowIndex], [field]: value };
        return clone;
      });
      const res = await fetch(`${backendUrl}/aec/${projectId}/plans/${planId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "No se pudo guardar el cambio.");
    } catch (err) {
      console.error(err);
      alert(`Error al guardar: ${err.message}`);
      loadPlans();
    }
  };

  const handleSyncMatch = async () => {
    if (!selectedModelsIds.length || !selectedFolderId || !altProjectId) {
      alert("Selecciona modelos y folder de planos para sincronizar con AEC/ACC.");
      return;
    }
    try {
      const res = await fetch(`${backendUrl}/aec/${projectId}/plans/match`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-alt-project-id": altProjectId,
          "selected-folder-id": selectedFolderId,
        },
        body: JSON.stringify({}), // si necesitas params extra
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Error al sincronizar.");
      await loadPlans();
      alert("Sincronización con AEC/ACC completada.");
    } catch (e) {
      console.error(e);
      alert(e.message);
    }
  };


  // Render normal
  return (
    <MainLayout>
      <div>
        <h2 className="text-xl font-bold mb-4">Project Sheets</h2>

        <div className="mb-6 flex gap-3">
          <Button
            className="bg-[rgb(170,32,47)] text-white"
            onClick={() => setModalOpen(true)}
          >
            Seleccionar modelos para analizar
          </Button>
          <Button
            className="bg-[rgb(170,32,47)] text-white"
            onClick={() => setFolderModalOpen(true)}
          >
            Seleccionar folder de planos
          </Button>

          <Button variant="outline" onClick={handleClickImport} title="Importar desde Excel">
            Importar desde Excel
          </Button>
          <Button variant="outline" onClick={handleExportExcel} title="Exportar a Excel">
            Exportar a Excel
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />

        </div>

        <SelectModelsModal
          models={models}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={async (selectedModelIds) => {
            await fetch(`${backendUrl}/aec/${projectId}/graphql-models/set-selection`, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ modelIds: selectedModelIds }),
            });
            setSelectedModelsIds(selectedModelIds);
            setModalOpen(false);
          }}
        />

        <SelectFolderModal
          open={folderModalOpen}
          onClose={() => setFolderModalOpen(false)}
          folderTree={folderTree}
          onSave={async (folderId) => {
            await fetch(`${backendUrl}/aec/${projectId}/graphql-folders/set-selection`, {
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

        {error && (
          <div className="mb-4 text-red-600 font-semibold">{error}</div>
        )}

         <SheetsTable data={plans} onEdit={handleEdit} />
      </div>
    </MainLayout>
  );
}
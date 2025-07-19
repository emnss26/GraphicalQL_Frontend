import React, { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { useParams } from "react-router-dom";

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
  const [selectedModelsIds, setSelectedModelsIds] = useState([]); // << nuevo estado para modelos seleccionados
  const [topFolders, setTopFolders] = useState([]);
  const [subFolders, setSubFolders] = useState([]);
  const [folderFiles, setFolderFiles] = useState([]);
  const [sheets, setSheets] = useState([]);
  const [sheetRows, setSheetRows] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folderTree, setFolderTree] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [error, setError] = useState("");

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

  
  // Si falta seleccionar modelos o folder, mostrar aviso claro
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

        <SheetsTable data={sheetRows} />
      </div>
    </MainLayout>
  );
}
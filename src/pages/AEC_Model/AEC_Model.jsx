import React, { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import MainLayout from "@/components/general_component/MainLayout";
import SheetsTable from "@/components/aec_model_components/SheetsTable";

const backendUrl = import.meta.env.VITE_API_BACKEND_BASE_URL;

export default function AECModelPage() {
  const [cookies] = useCookies(["access_token"]);
  const [hubs, setHubs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [models, setModels] = useState([]);
  const [topFolders, setTopFolders] = useState([]);
  const [subFolders, setSubFolders] = useState([]);
  const [folderFiles, setFolderFiles] = useState([]);
  const [sheets, setSheets] = useState([]);
  const [sheetRows, setSheetRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHubs = async () => {
      try {
        const response = await fetch(`${backendUrl}/aec/graphql-hubs`, {
          credentials: "include",
        });
        const result = await response.json();

        console.log("Fetched Hubs:", result.data.hubs);
        console.log("Fetched Projects:", result.data.projects);
        console.log("Fetched Models:", result.data.models);
        console.log("Sheets", result.data.sheets);
        console.log("Top Folders", result.data.topFolders);
        console.log("SubFolders", result.data.subFolders);
        console.log("Files", result.data.files);
        console.log("Revisions", result.data.projectReviews);
        console.log("Revision Status", result.data.revisionStatuses);

        setHubs(result.data.hubs);
        setProjects(result.data.projects);
        setModels(result.data.models);
        setTopFolders(result.data.topFolders);
        setSubFolders(result.data.subFolders);
      setFolderFiles(result.data.files);
      setSheets(result.data.sheets || []);
      setError("");
    } catch (err) {
        setError("Failed to fetch hubs.");
        console.error(err);
      }
    };

    fetchHubs();
  }, []);

  useEffect(() => {
    if (!sheets.length) return;
    const fileNames = folderFiles.map((f) =>
      f.attributes?.displayName?.toLowerCase() || ""
    );
    const rows = sheets.map((sheet) => {
      const props = sheet.properties?.results || [];
      const name =
        props.find((p) => p.name === "Sheet Name")?.value || sheet.name || "";
      const number = props.find((p) => p.name === "Sheet Number")?.value || "";
      const currentRevision = props.find(
        (p) => p.name === "Current Revision"
      )?.value;
      const currentRevisionDesc = props.find(
        (p) => p.name === "Current Revision Description"
      )?.value;
      const currentRevisionDate = props.find(
        (p) => p.name === "Current Revision Date"
      )?.value;

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

  useEffect(() => {
    console.log({ projects, models, topFolders, subFolders, folderFiles, error });
  }, [projects, models, topFolders, subFolders, folderFiles, error]);

  if (!cookies) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <h1 className="text-3xl font-bold mb-6">Access Denied</h1>
        <p className="mb-4 text-gray-600">
          You need to log in to access the AEC Model.
        </p>
        <button
          className="btn-primary font-medium px-6 py-3 rounded-md shadow transition-colors"
          onClick={() => (window.location.href = "/login")}
        >
          Go to Login
        </button>
      </div>
    );
  }

  console.log("Cookies:", cookies);
  console.log("Hubs:", hubs);

  return (
    <MainLayout>
      <div>
        <h2 className="text-xl font-bold mb-4">Project Sheets</h2>
        <SheetsTable data={sheetRows} />
      </div>
    </MainLayout>
  );
}

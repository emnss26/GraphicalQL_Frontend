import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, Folder } from "lucide-react";

// Componente recursivo para el árbol de carpetas colapsable
function TreeNode({ node, selectedId, setSelected, depth = 0 }) {
  const [open, setOpen] = useState(false);
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;

  const handleExpand = (e) => {
    e.stopPropagation();
    setOpen((o) => !o);
  };

  return (
    <div style={{ marginLeft: depth * 16, display: "flex", alignItems: "center" }}>
      {hasChildren ? (
        <button
          onClick={handleExpand}
          className="mr-1 flex items-center"
          tabIndex={-1}
          type="button"
        >
          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>
      ) : (
        <span style={{ width: 18, display: "inline-block" }} />
      )}
      <label className="flex items-center gap-2 cursor-pointer py-0.5 w-full">
        <input
          type="radio"
          checked={selectedId === node.id}
          onChange={() => setSelected(node.id)}
          className="accent-[rgb(170,32,47)]"
        />
        <Folder size={15} className="text-gray-500" />
        <span className={selectedId === node.id ? "font-bold text-[rgb(170,32,47)]" : ""}>
          {node.name}
        </span>
      </label>
      {open && hasChildren && (
        <div className="w-full">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              setSelected={setSelected}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SelectFolderModal({
  open,
  onClose,
  folderTree,
  onSave,
  selectedFolderId
}) {
  const [selected, setSelected] = useState(selectedFolderId || null);

  useEffect(() => {
    setSelected(selectedFolderId);
  }, [selectedFolderId]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[75vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Selecciona el folder donde están los planos</DialogTitle>
        </DialogHeader>
        <div className="border rounded p-2 bg-gray-50">
          {folderTree?.length > 0 ? (
            folderTree.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                selectedId={selected}
                setSelected={setSelected}
              />
            ))
          ) : (
            <div className="p-6 text-gray-500">Cargando folders...</div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="secondary">Cancelar</Button>
          <Button
            className="bg-[rgb(170,32,47)] text-white"
            disabled={!selected}
            onClick={() => selected && onSave(selected)}
          >
            Guardar selección
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
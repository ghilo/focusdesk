"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { Edit2, ArchiveRestore, Archive, Trash2 } from "lucide-react";

export default function ClientsPage() {
  const { clients, projects, tasks, addClient, deleteClient, updateClient, fetchData } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    addClient({ name: newClientName.trim() });
    setIsCreating(false);
    setNewClientName("");
  };

  const handleArchive = (clientId: string) => {
    if (window.confirm("Voulez-vous vraiment archiver ce client ? Ses projets seront masqués.")) {
      updateClient(clientId, { archived: true });
    }
  };

  const handleDelete = (clientId: string) => {
    const clientTasks = tasks.filter((t) => t.clientId === clientId);
    
    if (clientTasks.length > 0) {
      window.alert("Impossible : Ce client possède encore des tâches (actives ou terminées). Veuillez d'abord les supprimer, ou contentez-vous d'archiver le client.");
      return;
    }

    if (window.confirm("Voulez-vous supprimer ce client définitivement ? Action irréversible.")) {
      deleteClient(clientId);
    }
  };

  const handleUnarchive = (clientId: string) => {
    updateClient(clientId, { archived: false });
  };

  const startEditing = (clientId: string, currentName: string) => {
    setEditingId(clientId);
    setEditName(currentName);
  };

  const saveEdit = (clientId: string) => {
    if (editName.trim()) {
      updateClient(clientId, { name: editName.trim() });
    }
    setEditingId(null);
  };

  return (
    <div className="max-w-5xl mx-auto py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground">Clients</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm md:text-base">Vos partenaires et commanditaires.</p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2.5 bg-gradient-to-br from-primary-dim to-primary text-foreground font-medium rounded-xl hover:shadow-[0_0_24px_rgba(186,158,255,0.2)] transition-all duration-300"
        >
          {isCreating ? "Annuler" : "Nouveau client"}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="mb-8 p-6 bg-surface-container rounded-2xl flex flex-col md:flex-row gap-4 items-end animate-slide-in-right">
          <div className="flex-1 w-full space-y-2">
            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Nom du client</label>
            <input
              type="text"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              className="w-full bg-surface-highest/50 border border-transparent rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              autoFocus
            />
          </div>
          <button type="submit" className="w-full md:w-auto px-8 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-zinc-200 transition-colors shadow-sm focus:outline-none">
            Créer
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...clients].sort((a, b) => Number(!!a.archived) - Number(!!b.archived)).map((client) => {
          const clientProjects = projects.filter((p) => p.clientId === client.id);
          const clientTasks = tasks.filter((t) => t.clientId === client.id && t.status === "active");
          const isArchived = client.archived;

          return (
            <div key={client.id} className={`p-6 rounded-2xl transition-all duration-300 relative group flex flex-col ${isArchived ? "bg-surface-container/30 border-transparent opacity-60" : "bg-surface-container hover:bg-surface-highest hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:-translate-y-1"}`}>
              {!isArchived && (
                <div className="absolute top-4 right-4 flex gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleArchive(client.id)}
                    className="text-zinc-500 hover:text-primary transition-colors"
                    title="Archiver le client"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(client.id)}
                    className="text-zinc-500 hover:text-danger transition-colors"
                    title="Supprimer définitivement le client"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              {isArchived && (
                <button 
                  onClick={() => handleUnarchive(client.id)}
                  className="absolute top-4 right-4 text-zinc-500 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Désarchiver le client"
                >
                  <ArchiveRestore className="w-5 h-5" />
                </button>
              )}
              
              <div className="mb-8">
                {editingId === client.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit(client.id)}
                      autoFocus
                      className="bg-surface border border-primary/50 rounded-lg px-2 py-1 text-foreground text-xl font-bold w-full md:max-w-[200px] outline-none"
                    />
                    <button onClick={() => saveEdit(client.id)} className="text-primary text-sm font-medium hover:text-primary-hover px-2">OK</button>
                    <button onClick={() => setEditingId(null)} className="text-zinc-500 text-sm font-medium hover:text-foreground">Annuler</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <h3 
                      onDoubleClick={() => !isArchived && startEditing(client.id, client.name)} 
                      className="font-display text-2xl font-bold text-foreground tracking-tight flex items-center gap-2 cursor-text"
                      title={!isArchived ? "Double-cliquez pour renommer" : ""}
                    >
                      @{client.name}
                      {isArchived && <span className="text-[10px] uppercase font-bold bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-md">Archivé</span>}
                    </h3>
                    {!isArchived && (
                      <button 
                        onClick={() => startEditing(client.id, client.name)}
                        className="text-zinc-500 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-primary/10"
                        title="Renommer le client"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              <div className="mt-auto grid grid-cols-2 gap-4 border-t border-foreground/5 border-opacity-10 dark:border-opacity-5 pt-4">
                <div>
                  <div className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-1">Projets</div>
                  <div className="font-display text-2xl font-extrabold text-foreground">{clientProjects.length}</div>
                </div>
                <div>
                  <div className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-1">Tâches</div>
                  <div className="font-display text-2xl font-extrabold text-foreground">{clientTasks.length}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {clients.length === 0 && !isCreating && (
        <div className="text-center py-20 bg-surface-container rounded-2xl">
          <p className="text-zinc-500 font-medium">Aucun client pour le moment.</p>
        </div>
      )}
    </div>
  );
}

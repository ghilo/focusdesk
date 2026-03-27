"use client";

import { useState, useEffect, Suspense } from "react";
import { useStore } from "@/store/useStore";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Edit2 } from "lucide-react";

function ProjectsPageInner() {
  const searchParams = useSearchParams();
  const { projects, clients, tasks, addProject, updateProject, deleteProject, fetchData } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectClient, setNewProjectClient] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    fetchData();
    if (searchParams.get("new") === "true") {
      setIsCreating(true);
    }
  }, [fetchData, searchParams]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newProjectName.trim()) {
      setError("Le nom du projet est obligatoire.");
      return;
    }
    if (!newProjectClient) {
      setError("Un projet doit être associé à un client. Créez au moins un client d'abord !");
      return;
    }

    addProject({
      name: newProjectName.trim(),
      clientId: newProjectClient,
    });
    setIsCreating(false);
    setNewProjectName("");
    setNewProjectClient("");
  };

  const startEditing = (projectId: string, currentName: string) => {
    setEditingId(projectId);
    setEditName(currentName);
  };

  const saveEdit = (projectId: string) => {
    if (editName.trim()) {
      updateProject(projectId, { name: editName.trim() });
    }
    setEditingId(null);
  };

  return (
    <div className="max-w-5xl mx-auto py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground">Projets</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm md:text-base">Gérez vos chantiers en cours.</p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2.5 bg-gradient-to-br from-primary-dim to-primary text-foreground font-medium rounded-xl hover:shadow-[0_0_24px_rgba(186,158,255,0.2)] transition-all duration-300"
        >
          {isCreating ? "Annuler" : "Nouveau projet"}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="mb-8 p-6 bg-surface-container rounded-2xl flex flex-col md:flex-row gap-4 items-end animate-slide-in-right">
          <div className="flex-1 w-full space-y-2">
            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Nom du projet</label>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full bg-surface-highest/50 border border-transparent rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              autoFocus
            />
          </div>
          <div className="flex-1 w-full space-y-2">
            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Client associé <span className="text-danger">*</span></label>
            <select
              value={newProjectClient}
              onChange={(e) => {
                setNewProjectClient(e.target.value);
                if (error) setError("");
              }}
              className="w-full bg-surface-highest/50 border border-transparent rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer"
            >
              <option value="">Sélectionnez un client</option>
              {clients.filter(c => !c.archived).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button type="submit" className="w-full md:w-auto px-8 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-zinc-200 transition-colors shadow-sm focus:outline-none">
            Créer
          </button>
        </form>
      )}
      
      {isCreating && error && (
        <div className="mb-6 p-4 bg-danger/10 border border-danger/30 text-danger rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects
          .filter((project) => {
            const client = clients.find(c => c.id === project.clientId);
            return !client?.archived;
          })
          .map((project) => {
          const projectTasks = tasks.filter((t) => t.projectId === project.id);
          const activeTasks = projectTasks.filter((t) => t.status === "active").length;
          const doneTasks = projectTasks.filter((t) => t.status === "done").length;
          const totalTasks = projectTasks.length;
          const progress = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);
          const client = clients.find(c => c.id === project.clientId);

          return (
            <div key={project.id} className="relative group">
              <Link href={`/projects/${project.id}`} className="block p-6 bg-surface-container rounded-2xl hover:bg-surface-highest hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all duration-300 flex flex-col h-full border border-transparent">
              <button
                onClick={(e) => { e.preventDefault(); deleteProject(project.id); }}
                className="absolute top-4 right-4 text-zinc-500 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity z-10"
                title="Supprimer le projet"
              >
                ×
              </button>
              <div className="mb-1.5">
                {editingId === project.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit(project.id)}
                      autoFocus
                      className="bg-zinc-900 border border-primary/50 rounded-lg px-2 py-1 text-foreground text-xl font-bold w-full outline-none"
                    />
                    <button onClick={(e) => { e.preventDefault(); saveEdit(project.id); }} className="text-primary text-sm font-medium hover:text-primary-hover px-2">OK</button>
                    <button onClick={(e) => { e.preventDefault(); setEditingId(null); }} className="text-zinc-500 text-sm font-medium hover:text-foreground">Annuler</button>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 pr-6">
                    <h3
                      onDoubleClick={(e) => { e.preventDefault(); startEditing(project.id, project.name); }}
                      className="font-display text-2xl font-bold text-foreground tracking-tight cursor-text"
                      title="Double-cliquez pour renommer"
                    >
                      {project.name}
                    </h3>
                    <button
                      onClick={(e) => { e.preventDefault(); startEditing(project.id, project.name); }}
                      className="text-zinc-500 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-primary/10 mt-0.5 z-10 relative"
                      title="Renommer le projet"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              {client && <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium tracking-tight mb-8">@{client.name}</p>}
              {!client && <p className="text-sm text-zinc-500 mb-8">Projet interne</p>}

              <div className="mt-auto">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <span className="font-display text-3xl font-extrabold text-foreground mr-1.5">{activeTasks}</span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">tâche{activeTasks !== 1 ? 's' : ''} active{activeTasks !== 1 ? 's' : ''}</span>
                  </div>
                  <span className="text-sm font-bold text-primary">{progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-surface-highest rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary-dim to-primary transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              </Link>
            </div>
          );
        })}
      </div>
      
      {projects.length === 0 && !isCreating && (
        <div className="text-center py-20 bg-surface-container rounded-2xl">
          <p className="text-zinc-500 font-medium">Aucun projet pour le moment.</p>
        </div>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500 font-medium">Chargement des projets...</div>}>
      <ProjectsPageInner />
    </Suspense>
  );
}

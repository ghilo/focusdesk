"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useStore } from "@/store/useStore";
import TaskForm from "@/components/TaskForm";
import CountdownTimer from "@/components/CountdownTimer";
import { Plus, Search, Bell, Command, MoreVertical, ClipboardList, AlertCircle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Task } from "@/types";
import clsx from "clsx";

export default function Dashboard() {
  const { data: session } = useSession();
  const { tasks, projects, clients, completeTask, fetchData } = useStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [filterType, setFilterType] = useState<"all" | "urgent">("all");

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Ajouter un raccourci clavier pour Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("global-search")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isClientArchived = (clientId: string | null) => {
    if (!clientId) return false;
    const client = clients.find(c => c.id === clientId);
    return client?.archived === true;
  };

  const baseActiveTasks = tasks.filter((t) => {
    if (t.status !== "active") return false;
    if (isClientArchived(t.clientId)) return false;
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedClient !== "all" && t.clientId !== selectedClient) return false;
    return true;
  }).sort((a, b) => {
    if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return a.order - b.order;
  });

  const isUrgent = (task: Task) => {
    if (task.priority === "high") return true;
    if (task.dueDate) {
      const dueTime = new Date(task.dueDate).getTime();
      const nowTime = new Date().getTime();
      return (dueTime - nowTime) <= 24 * 60 * 60 * 1000;
    }
    return false;
  };

  const urgentCount = baseActiveTasks.filter(isUrgent).length;
  
  const baseDoneTasks = tasks.filter((t) => t.status === "done" && !isClientArchived(t.clientId));
  const doneTodayCount = baseDoneTasks.filter((t) => {
    if (!t.completedAt) return false;
    const today = new Date();
    const completedDate = new Date(t.completedAt);
    return completedDate.getDate() === today.getDate() && completedDate.getMonth() === today.getMonth() && completedDate.getFullYear() === today.getFullYear();
  }).length;

  const displayTasks = baseActiveTasks.filter((t) => filterType === "urgent" ? isUrgent(t) : true);

  return (
    <div className="w-full min-h-screen bg-background text-foreground p-6 md:p-10">
      
      {/* Top Header */}
      <header className="flex justify-end items-center mb-12">
        <div className="hidden md:flex items-center gap-6">
          <button 
            onClick={() => alert("Aucune nouvelle notification pour le moment.")}
            className="text-zinc-500 dark:text-zinc-400 hover:text-foreground transition-colors focus:outline-none"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => document.getElementById("global-search")?.focus()}
            className="text-zinc-500 dark:text-zinc-400 hover:text-foreground transition-colors focus:outline-none"
            title="Rechercher (⌘K)"
          >
            <Command className="w-5 h-5" />
          </button>
          
          <a href="/settings" className="hover:opacity-80 transition-opacity" title="Paramètres du profil">
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="User" className="w-8 h-8 rounded-full border border-foreground/10 border-opacity-10 dark:border-opacity-10 shadow-sm" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-500 dark:text-zinc-400 flex items-center justify-center text-xs font-bold border border-foreground/5 border-opacity-10 dark:border-opacity-5 shadow-sm">
                {session?.user?.name?.charAt(0) || "U"}
              </div>
            )}
          </a>
        </div>
      </header>

      {/* Greeting */}
      <div className="mb-10">
        <h1 className="font-display text-4xl font-black tracking-tight flex items-center gap-3">
          Bonjour <span className="text-primary-dim">{session?.user?.name || "Aghiles"}</span> 👋
        </h1>
        <p className="text-zinc-500 font-medium mt-1 text-sm md:text-base tracking-wide">Voici ce qui requiert votre attention aujourd&apos;hui.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        
        {/* Total Active Tasks Card */}
        <div 
          onClick={() => setFilterType("all")}
          className={clsx(
            "rounded-2xl p-6 relative overflow-hidden group transition-all duration-300 cursor-pointer border",
            filterType === "all" ? "bg-surface-highest border-primary/30 shadow-xl shadow-primary/5" : "bg-surface-container border-transparent hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-primary/10 hover:border-foreground/5 border-opacity-10 dark:border-opacity-5"
          )}
        >
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] font-bold text-zinc-500 tracking-widest uppercase">Toutes les actives</span>
            <div className={clsx(
              "p-1.5 rounded-lg text-foreground transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300",
              filterType === "all" ? "bg-primary shadow-md shadow-primary/20" : "bg-primary"
            )}><ClipboardList className="w-4 h-4" /></div>
          </div>
          <p className="font-display text-5xl font-black">{baseActiveTasks.length}</p>
          <div className="mt-8 flex gap-1 h-1.5 w-full bg-surface-highest rounded-full overflow-hidden">
            <div className="h-full bg-primary w-[45%]" />
          </div>
        </div>

        {/* Urgent Card */}
        <div 
          onClick={() => setFilterType("urgent")}
          className={clsx(
            "rounded-2xl p-6 relative overflow-hidden group transition-all duration-300 cursor-pointer border",
            filterType === "urgent" ? "bg-surface-highest border-danger/40 shadow-xl shadow-danger/10" : "bg-surface-container border-transparent hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-danger/10 hover:border-danger/10"
          )}
        >
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] font-bold text-zinc-500 tracking-widest uppercase">Urgentes</span>
            <div className={clsx(
              "transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300",
              filterType === "urgent" ? "text-danger" : "text-danger"
            )}><AlertCircle className="w-5 h-5 stroke-[2.5]" /></div>
          </div>
          <p className="font-display text-5xl font-black text-danger">{urgentCount}</p>
          <div className="mt-8 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-danger" />
            <p className="text-xs font-medium text-danger">Échéance sous 24h</p>
          </div>
        </div>

        {/* Completed Today Card */}
        <div className="bg-surface-container rounded-2xl p-6 relative overflow-hidden group border border-transparent hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/10 transition-all duration-300 cursor-pointer">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] font-bold text-zinc-500 tracking-widest uppercase">Terminées aujourd&apos;hui</span>
            <div className="text-primary transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300"><CheckCircle2 className="w-5 h-5 stroke-[2.5]" /></div>
          </div>
          <div className="flex items-baseline gap-3">
            <p className="font-display text-5xl font-black">{doneTodayCount}</p>
            <span className="text-sm font-bold text-primary">+25% vs hier</span>
          </div>
          <p className="mt-7 text-xs font-medium text-zinc-500">Pic de productivité à 11h</p>
        </div>
      </div>

      {/* Active Tasks Section */}
      <div className="flex justify-between items-center mb-6 mt-8">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-xl font-bold tracking-tight">
            {filterType === "urgent" ? "Tâches urgentes" : "Tâches en cours"}
          </h2>
          {filterType === "urgent" && displayTasks.length > 0 && (
            <span className="bg-danger/10 text-danger text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
              {displayTasks.length}
            </span>
          )}
        </div>
        <button 
          onClick={() => { setEditingTask(null); setIsFormOpen(true); }}
          className="bg-primary hover:bg-primary-hover text-surface-highest py-2.5 px-6 rounded-xl flex items-center gap-2 font-extrabold text-sm transition-all shadow-sm focus:outline-none"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" /> Nouvelle Tâche
        </button>
      </div>

      <div className="flex flex-col md:flex-row w-full gap-4 mb-6">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
          <input 
            id="global-search"
            type="text" 
            placeholder="Rechercher une tâche... (⌘K)" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-full bg-surface-container rounded-lg pl-11 pr-4 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary border-transparent placeholder:text-zinc-500 transition-all" 
          />
        </div>
        <select 
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="bg-surface-container rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-500 focus:text-foreground focus:outline-none focus:ring-1 focus:ring-primary border-transparent transition-all cursor-pointer md:w-64 appearance-none bg-no-repeat bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1em_1em] bg-[right_1rem_center] pr-10"
        >
          <option value="all">Tous les clients</option>
          {clients.filter(c => !c.archived).map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Modern Tasks Table */}
      {displayTasks.length === 0 ? (
        <div className="text-center py-20 bg-surface-container rounded-2xl border border-foreground/5 border-opacity-10 dark:border-opacity-5">
          <p className="text-zinc-500 font-medium">{filterType === "urgent" ? "Aucune tâche urgente pour le moment. 😌" : "Aucune tâche pour le moment."}</p>
        </div>
      ) : (
        <div className="w-full bg-surface-container rounded-2xl overflow-hidden mt-4 pb-2">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="text-[11px] font-extrabold text-zinc-500 tracking-widest uppercase border-b border-foreground/5 border-opacity-10 dark:border-opacity-5">
                <th className="px-6 py-5 w-16"></th>
                <th className="px-6 py-5">Nom de la tâche</th>
                <th className="px-6 py-5">Nom du projet</th>
                <th className="px-6 py-5">Client</th>
                <th className="px-6 py-5">Échéance</th>
                <th className="px-6 py-5">Priorité</th>
                <th className="px-6 py-5 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5 divide-opacity-10 dark:divide-opacity-5">
              {displayTasks.map((task) => {
                const project = projects.find(p => p.id === task.projectId);
                const client = clients.find(c => c.id === task.clientId);
                return (
                  <tr key={task.id} className="hover:bg-surface-highest/50 transition-colors group cursor-pointer" onClick={() => { setEditingTask(task); setIsFormOpen(true); }}>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => completeTask(task.id)}
                        className="w-5 h-5 rounded border border-zinc-600 flex items-center justify-center hover:border-primary focus:outline-none transition-colors"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-sm tracking-wide text-foreground group-hover:text-primary transition-colors">{task.title}</span>
                    </td>
                    <td className="px-6 py-4">
                      {project ? (
                        <div className="flex items-center gap-2.5">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{project.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-zinc-600">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {client ? (
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{client.name}</span>
                      ) : (
                        <span className="text-sm font-medium text-zinc-600">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={clsx(
                          "text-sm font-medium",
                          isUrgent(task) ? "text-danger font-bold" : "text-zinc-500 dark:text-zinc-400"
                        )}>
                          {task.dueDate ? format(new Date(task.dueDate), "dd MMM, yyyy", { locale: fr }) : "-"}
                        </span>
                        {task.dueDate && <CountdownTimer dueDate={task.dueDate} isUrgent={isUrgent(task)} />}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        "text-[10px] uppercase tracking-widest font-black px-3.5 py-1.5 rounded-xl",
                        task.priority === "high" ? "bg-danger text-foreground" :
                        task.priority === "medium" ? "bg-primary-dim text-foreground" :
                        "bg-surface-highest text-zinc-500 dark:text-zinc-400"
                      )}>
                        {task.priority === "high" ? "Urgente" : task.priority === "medium" ? "Normale" : "Basse"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-zinc-600 hover:text-foreground p-1 rounded-md focus:outline-none">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Task Modal Edit */}
      <TaskForm 
        isOpen={isFormOpen} 
        onClose={() => { setIsFormOpen(false); setTimeout(() => setEditingTask(null), 300); }} 
        taskToEdit={editingTask} 
      />
    </div>
  );
}

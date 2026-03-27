"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { Trash2, AlertTriangle, Moon, Sun, Monitor, User, Loader2 } from "lucide-react";
import clsx from "clsx";

export default function SettingsPage() {
  const { clients, deleteClient, fetchData } = useStore();
  const { data: session, update } = useSession();
  const { theme, setTheme } = useTheme();
  
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ text: "", type: "" });
  
  // Mounted state to wait for theme to load before rendering the toggle correctly
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    setSaveMessage({ text: "", type: "" });

    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        setSaveMessage({ text: "Profil sauvegardé avec succès.", type: "success" });
        // Force NextAuth to update the session to reflect the new name in the navigation bar immediately
        await update({ name });
      } else {
        throw new Error("API error");
      }
    } catch {
      setSaveMessage({ text: "Erreur lors de la sauvegarde.", type: "error" });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage({ text: "", type: "" }), 3000);
    }
  };

  const handleDeleteClient = (id: string, clientName: string) => {
    if (window.confirm(`Voulez-vous supprimer le client "${clientName}" ?\n\nAttention : Ses projets et ses tâches seront également supprimés (action irréversible).`)) {
      deleteClient(id);
    }
  };

  if (!mounted) return null;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 md:px-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Paramètres</h1>

      <div className="space-y-10">
        
        {/* Section Profile */}
        <section className="bg-surface border border-border rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-primary/20 rounded-xl">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Profil</h2>
              <p className="text-sm text-zinc-400">Gérez vos informations personnelles.</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="max-w-md space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-1.5">Nom complet</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-900 border border-border rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Votre nom"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={isSaving || !name.trim() || name === session?.user?.name}
                className="flex items-center gap-2 bg-primary text-white font-medium px-5 py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Sauvegarder
              </button>
              
              {saveMessage.text && (
                <span className={clsx("text-sm", saveMessage.type === "success" ? "text-emerald-500" : "text-danger")}>
                  {saveMessage.text}
                </span>
              )}
            </div>
          </form>
        </section>

        {/* Section Appearance */}
        <section className="bg-surface border border-border rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-500/20 rounded-xl">
              <Moon className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Apparence</h2>
              <p className="text-sm text-zinc-400">Personnalisez l&apos;affichage de l&apos;interface.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setTheme("dark")}
              className={clsx(
                "flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border-2 transition-all flex-1 md:flex-none",
                theme === "dark" ? "border-primary bg-primary/10" : "border-border hover:border-zinc-500 bg-zinc-900/50"
              )}
            >
              <Moon className={clsx("w-5 h-5", theme === "dark" ? "text-primary" : "text-zinc-400")} />
              <span className={clsx("font-medium", theme === "dark" ? "text-primary" : "text-zinc-400")}>Sombre</span>
            </button>
            <button
              onClick={() => setTheme("light")}
              className={clsx(
                "flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border-2 transition-all flex-1 md:flex-none",
                theme === "light" ? "border-primary bg-primary/10" : "border-border hover:border-zinc-500 bg-zinc-900/50"
              )}
            >
              <Sun className={clsx("w-5 h-5", theme === "light" ? "text-primary" : "text-zinc-400")} />
              <span className={clsx("font-medium", theme === "light" ? "text-primary" : "text-zinc-400")}>Clair</span>
            </button>
            <button
              onClick={() => setTheme("system")}
              className={clsx(
                "flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border-2 transition-all flex-1 md:flex-none",
                theme === "system" ? "border-primary bg-primary/10" : "border-border hover:border-zinc-500 bg-zinc-900/50"
              )}
            >
              <Monitor className={clsx("w-5 h-5", theme === "system" ? "text-primary" : "text-zinc-400")} />
              <span className={clsx("font-medium", theme === "system" ? "text-primary" : "text-zinc-400")}>Système</span>
            </button>
          </div>
        </section>

        {/* Section Danger Zone (Ancien Admin) */}
        <section className="border-2 border-danger/30 bg-danger/5 text-danger rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-danger/20 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-danger" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Zone de Danger</h2>
              <p className="text-sm opacity-80">Actions irréversibles. Suppression forcée des données de la base.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-background/80 border border-danger/20 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold mb-1">Supprimer des clients</h3>
                <p className="text-sm opacity-70">Supprime un client. Tous ses projets et tâches seront supprimés définitivement.</p>
              </div>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                 {clients.length === 0 ? (
                    <span className="text-sm italic opacity-60">Aucun client</span>
                 ) : (
                   clients.map(c => (
                     <button 
                       key={c.id} 
                       onClick={() => handleDeleteClient(c.id, c.name)}
                       className="text-xs bg-danger/10 hover:bg-danger hover:text-white border border-danger/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                     >
                       <Trash2 className="w-3.5 h-3.5" />
                       {c.name}
                     </button>
                   ))
                 )}
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}

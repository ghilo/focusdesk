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
  
  const [telegramChatId, setTelegramChatId] = useState("");
  const [isSavingTelegram, setIsSavingTelegram] = useState(false);
  const [telegramSaveMessage, setTelegramSaveMessage] = useState({ text: "", type: "" });
  const [isTesting, setIsTesting] = useState(false);
  const [testMessage, setTestMessage] = useState({ text: "", type: "" });

  const [notifyOnCreate, setNotifyOnCreate] = useState(true);
  const [notifyDailyBriefing, setNotifyDailyBriefing] = useState(false);
  const [dailyBriefingTime, setDailyBriefingTime] = useState("08:00");
  const [notifyApproachingDeadline, setNotifyApproachingDeadline] = useState(false);
  const [notifyOverdue, setNotifyOverdue] = useState(false);

  // Mounted state to wait for theme to load before rendering the toggle correctly
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchData();
    
    fetch('/api/user/telegram')
      .then(res => res.json())
      .then(data => {
        if (data.telegramChatId) setTelegramChatId(data.telegramChatId);
        if (data.notifyOnCreate !== undefined) setNotifyOnCreate(data.notifyOnCreate);
        if (data.notifyDailyBriefing !== undefined) setNotifyDailyBriefing(data.notifyDailyBriefing);
        if (data.dailyBriefingTime) setDailyBriefingTime(data.dailyBriefingTime);
        if (data.notifyApproachingDeadline !== undefined) setNotifyApproachingDeadline(data.notifyApproachingDeadline);
        if (data.notifyOverdue !== undefined) setNotifyOverdue(data.notifyOverdue);
      })
      .catch(console.error);
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

  const handleSaveTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTelegram(true);
    setTelegramSaveMessage({ text: "", type: "" });

    try {
      const res = await fetch("/api/user/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          telegramChatId,
          notifyOnCreate,
          notifyDailyBriefing,
          dailyBriefingTime,
          notifyApproachingDeadline,
          notifyOverdue
        }),
      });

      if (res.ok) {
        setTelegramSaveMessage({ text: "Chat ID sauvegardé.", type: "success" });
      } else {
        throw new Error("API error");
      }
    } catch {
      setTelegramSaveMessage({ text: "Erreur de sauvegarde.", type: "error" });
    } finally {
      setIsSavingTelegram(false);
      setTimeout(() => setTelegramSaveMessage({ text: "", type: "" }), 3000);
    }
  };

  const handleTestTelegram = async () => {
    if (!telegramChatId.trim()) {
      setTestMessage({ text: "Veuillez d'abord entrer un Chat ID.", type: "error" });
      return;
    }
    
    setIsTesting(true);
    setTestMessage({ text: "", type: "" });
    try {
      const res = await fetch("/api/user/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramChatId }),
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        setTestMessage({ text: "Message de test envoyé sur votre téléphone !", type: "success" });
      } else {
        setTestMessage({ text: data.error || "Échec de l'envoi.", type: "error" });
      }
    } catch {
      setTestMessage({ text: "Erreur réseau.", type: "error" });
    } finally {
      setIsTesting(false);
      setTimeout(() => setTestMessage({ text: "", type: "" }), 6000);
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
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Gérez vos informations personnelles.</p>
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
                className="w-full bg-surface-highest border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Votre nom"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={isSaving || !name.trim() || name === session?.user?.name}
                className="flex items-center gap-2 bg-primary text-foreground font-medium px-5 py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Personnalisez l&apos;affichage de l&apos;interface.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setTheme("dark")}
              className={clsx(
                "flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border-2 transition-all flex-1 md:flex-none",
                theme === "dark" ? "border-primary bg-primary/10" : "border-border hover:border-zinc-500 bg-surface-highest/50"
              )}
            >
              <Moon className={clsx("w-5 h-5", theme === "dark" ? "text-primary" : "text-zinc-500 dark:text-zinc-400")} />
              <span className={clsx("font-medium", theme === "dark" ? "text-primary" : "text-zinc-500 dark:text-zinc-400")}>Sombre</span>
            </button>
            <button
              onClick={() => setTheme("light")}
              className={clsx(
                "flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border-2 transition-all flex-1 md:flex-none",
                theme === "light" ? "border-primary bg-primary/10" : "border-border hover:border-zinc-500 bg-surface-highest/50"
              )}
            >
              <Sun className={clsx("w-5 h-5", theme === "light" ? "text-primary" : "text-zinc-500 dark:text-zinc-400")} />
              <span className={clsx("font-medium", theme === "light" ? "text-primary" : "text-zinc-500 dark:text-zinc-400")}>Clair</span>
            </button>
            <button
              onClick={() => setTheme("system")}
              className={clsx(
                "flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border-2 transition-all flex-1 md:flex-none",
                theme === "system" ? "border-primary bg-primary/10" : "border-border hover:border-zinc-500 bg-surface-highest/50"
              )}
            >
              <Monitor className={clsx("w-5 h-5", theme === "system" ? "text-primary" : "text-zinc-500 dark:text-zinc-400")} />
              <span className={clsx("font-medium", theme === "system" ? "text-primary" : "text-zinc-500 dark:text-zinc-400")}>Système</span>
            </button>
          </div>
        </section>

        {/* Section Telegram */}
        <section className="bg-surface border border-border rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-500/20 rounded-xl">
              <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z"/></svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">Notifications Telegram</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Recevez des alertes lors de la création de tâches.</p>
            </div>
          </div>

          <form onSubmit={handleSaveTelegram} className="max-w-md space-y-4">
            <div>
              <label htmlFor="telegramChatId" className="block text-sm font-medium text-zinc-300 mb-1.5">Chat ID Telegram</label>
              <input
                id="telegramChatId"
                type="text"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                className="w-full bg-surface-highest border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Ex: 123456789"
              />
              <p className="text-xs text-zinc-500 mt-2">Vous pouvez obtenir votre Chat ID en envoyant un message à <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-primary hover:underline">@userinfobot</a>.</p>
            </div>

            <div className="space-y-5 pt-6 pb-2 border-t border-border">
              <h3 className="text-sm font-bold text-foreground">Préférences d&apos;alertes</h3>
              
              <label className="flex items-center justify-between cursor-pointer group gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-200">Alerte de création</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Recevoir un message immédiatement à chaque nouvelle tâche.</p>
                </div>
                <div className="relative inline-flex items-center">
                  <input type="checkbox" className="sr-only peer" checked={notifyOnCreate} onChange={(e) => setNotifyOnCreate(e.target.checked)} />
                  <div className="w-11 h-6 bg-zinc-700/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </div>
              </label>

              <div className="flex flex-col gap-3">
                <label className="flex items-center justify-between cursor-pointer group gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-200">Résumé du matin (Daily Briefing)</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Recevoir le planning de la journée sélectionnée.</p>
                  </div>
                  <div className="relative inline-flex items-center">
                    <input type="checkbox" className="sr-only peer" checked={notifyDailyBriefing} onChange={(e) => setNotifyDailyBriefing(e.target.checked)} />
                    <div className="w-11 h-6 bg-zinc-700/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </div>
                </label>
                {notifyDailyBriefing && (
                  <div className="pl-4 border-l-2 border-border ml-2 flex items-center gap-3">
                    <p className="text-sm text-zinc-400">Heure de réception :</p>
                    <select
                      value={dailyBriefingTime}
                      onChange={(e) => setDailyBriefingTime(e.target.value)}
                      className="bg-surface-highest border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {Array.from({ length: 24 }).map((_, i) => {
                        const hour = i.toString().padStart(2, '0');
                        return <option key={hour} value={`${hour}:00`}>{hour}:00</option>;
                      })}
                    </select>
                  </div>
                )}
              </div>

              <label className="flex items-center justify-between cursor-pointer group gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-200">Alerte d&apos;échéance imminente</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Être prévenu lorsqu&apos;une tâche expire dans moins de 24h.</p>
                </div>
                <div className="relative inline-flex items-center">
                  <input type="checkbox" className="sr-only peer" checked={notifyApproachingDeadline} onChange={(e) => setNotifyApproachingDeadline(e.target.checked)} />
                  <div className="w-11 h-6 bg-zinc-700/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer group gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-200">Alerte de retard</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Être notifié lorsqu&apos;une tâche dépasse sa date limite.</p>
                </div>
                <div className="relative inline-flex items-center">
                  <input type="checkbox" className="sr-only peer" checked={notifyOverdue} onChange={(e) => setNotifyOverdue(e.target.checked)} />
                  <div className="w-11 h-6 bg-zinc-700/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </div>
              </label>
            </div>
            
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isSavingTelegram}
                  className="flex items-center gap-2 bg-primary text-foreground font-medium px-5 py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSavingTelegram ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Sauvegarder
                </button>
                
                <button
                  type="button"
                  onClick={handleTestTelegram}
                  disabled={isTesting || !telegramChatId}
                  className="flex items-center gap-2 bg-surface-highest border border-border text-foreground font-medium px-5 py-2.5 rounded-xl hover:border-primary/50 hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Tester l&apos;envoi
                </button>
              </div>

              {(telegramSaveMessage.text || testMessage.text) && (
                <div className="text-sm font-medium animate-in fade-in slide-in-from-bottom-2">
                  {telegramSaveMessage.text && (
                    <p className={clsx(telegramSaveMessage.type === "success" ? "text-emerald-500" : "text-danger")}>
                      {telegramSaveMessage.text}
                    </p>
                  )}
                  {testMessage.text && (
                    <p className={clsx(testMessage.type === "success" ? "text-emerald-500" : "text-danger")}>
                      {testMessage.text}
                    </p>
                  )}
                </div>
              )}
            </div>
          </form>
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
                       className="text-xs bg-danger/10 hover:bg-danger hover:text-foreground border border-danger/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
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

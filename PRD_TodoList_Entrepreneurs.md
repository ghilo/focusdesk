# PRD — FocusDesk : ToDo List pour Entrepreneurs

---

## 1. Vue d'ensemble

- **Nom** : FocusDesk
- **Baseline** : Pilotez votre activité, vos clients et vos projets depuis une seule liste.
- **Problème résolu** : Les entrepreneurs jonglent entre tâches clients, projets internes et actions quotidiennes dispersées dans plusieurs outils. FocusDesk centralise tout en un point unique et actionnable.
- **Utilisateur cible** : Entrepreneur solo ou micro-équipe (1–5 personnes), gérant plusieurs projets et clients simultanément.
- **Valeur principale** : Réduire la charge mentale en offrant une vue unifiée et filtrée de toutes les tâches, classées par priorité, projet et client.

---

## 2. Fonctionnalités Core (MVP)

1. **Créer une tâche** → Une tâche apparaît immédiatement dans la liste avec son titre, sa priorité et son contexte (projet/client).
2. **Marquer une tâche comme terminée** → La tâche est archivée et disparaît de la vue active sans être supprimée.
3. **Filtrer les tâches** → Seules les tâches correspondant au filtre sélectionné (projet, client, priorité, statut) sont affichées.
4. **Organiser par projet et par client** → Chaque tâche est rattachée à un projet et/ou un client, permettant un regroupement visuel cohérent.
5. **Définir une date d'échéance** → La tâche affiche un indicateur visuel (badge rouge) si la date est dépassée.
6. **Réorganiser les tâches par drag-and-drop** → L'ordre manuel est persisté dans le localStorage.
7. **Tableau de bord synthétique** → Afficher en temps réel le nombre de tâches en cours, urgentes et terminées aujourd'hui.

---

## 3. Écrans & Flux Utilisateur

### Écran 1 — Tableau de bord (`/`)
- **Contenu** : En-tête avec logo + nom de l'app. Trois compteurs (En cours / Urgentes / Terminées aujourd'hui). Liste des tâches du jour triées par priorité décroissante.
- **Interactions** : Clic sur une tâche → ouvre le panneau de détail en sidebar droite. Clic sur le bouton "+" flottant → ouvre le formulaire de création.
- **Transition** : Toutes les transitions sont des slides horizontaux (200 ms, ease-in-out).

### Écran 2 — Formulaire de création / édition (sidebar droite)
- **Contenu** : Champ titre (obligatoire), sélecteur de priorité (Haute / Moyenne / Basse), sélecteur projet (liste déroulante + option "Créer"), sélecteur client (liste déroulante + option "Créer"), date d'échéance (date picker), zone de notes (textarea).
- **Interactions** : Bouton "Enregistrer" → valide et ferme la sidebar. Bouton "Annuler" → ferme sans sauvegarder. Si titre vide → afficher message d'erreur inline rouge sous le champ.
- **Transition** : Slide depuis la droite (200 ms).

### Écran 3 — Vue Projets (`/projects`)
- **Contenu** : Liste des projets sous forme de cartes. Chaque carte affiche : nom du projet, client associé, nombre de tâches actives, barre de progression (tâches terminées / total).
- **Interactions** : Clic sur une carte → filtre le tableau de bord sur ce projet. Bouton "Nouveau projet" dans l'en-tête → ouvre un modal de création (nom + client associé).

### Écran 4 — Vue Clients (`/clients`)
- **Contenu** : Liste des clients sous forme de cartes (nom, nombre de projets, nombre de tâches actives).
- **Interactions** : Clic sur une carte → filtre le tableau de bord sur ce client. Bouton "Nouveau client" → ouvre un modal de création (nom uniquement).

---

## 4. Modèle de Données

```ts
Task {
  id: string           // UUID v4
  title: string        // obligatoire, max 120 chars
  notes: string        // optionnel
  priority: enum["high", "medium", "low"]
  status: enum["active", "done"]
  dueDate: Date | null
  projectId: string | null
  clientId: string | null
  order: number        // entier pour le tri manuel
  createdAt: Date
  completedAt: Date | null
}

Project {
  id: string
  name: string         // obligatoire, unique
  clientId: string | null
  createdAt: Date
}

Client {
  id: string
  name: string         // obligatoire, unique
  createdAt: Date
}
```

---

## 5. Logique Métier

```
// Création de tâche
SI title EST vide
  ALORS afficher erreur "Le titre est obligatoire" et bloquer la soumission
SINON créer Task avec status="active", order=MAX(order)+1

// Complétion de tâche
SI utilisateur coche une tâche
  ALORS Task.status = "done", Task.completedAt = maintenant
  ET masquer la tâche de la vue active

// Indicateur d'urgence
SI Task.dueDate < Date.now() ET Task.status = "active"
  ALORS afficher badge rouge "En retard" sur la tâche

// Compteur "Urgentes"
Urgentes = COUNT(tasks WHERE priority="high" AND status="active")

// Compteur "Terminées aujourd'hui"
Terminées = COUNT(tasks WHERE completedAt >= début_du_jour ET status="done")

// Filtre actif
SI filtre (projet OU client OU priorité) EST sélectionné
  ALORS afficher UNIQUEMENT les tâches correspondantes
  SINON afficher toutes les tâches status="active"

// Suppression de projet
SI projet EST supprimé
  ALORS Task.projectId = null pour toutes les tâches associées
```

---

## 6. Stack & Contraintes Techniques

| Élément | Valeur imposée |
|---|---|
| Framework | Next.js 14 (App Router) |
| Style | Tailwind CSS v3 |
| Langage | TypeScript strict |
| Persistance | `localStorage` uniquement (pas de backend) |
| State management | Zustand |
| Drag-and-drop | `@dnd-kit/core` |
| Icons | `lucide-react` |
| Date picker | `react-day-picker` |
| Plateforme | Web responsive (mobile-first, breakpoints sm/md/lg) |
| Routing | Pages : `/`, `/projects`, `/clients` |
| Pas autorisé | Prisma, Supabase, Firebase, Redux, toute API externe |

**Patterns à respecter** :
- Données persistées dans `localStorage` via un hook `useLocalStorage<T>` générique.
- Chaque entité dans sa propre clé `localStorage` : `focusdesk_tasks`, `focusdesk_projects`, `focusdesk_clients`.
- Toutes les mutations passent par le store Zustand avant persistance.

---

## 7. Critères d'Acceptation

- [ ] Une tâche créée avec titre + priorité apparaît instantanément dans la liste active.
- [ ] Une tâche complétée disparaît de la vue active et incrémente le compteur "Terminées aujourd'hui".
- [ ] Le badge rouge "En retard" s'affiche sur toute tâche dont la date est dépassée.
- [ ] Le filtre par projet affiche exclusivement les tâches de ce projet.
- [ ] Le drag-and-drop réordonne les tâches et l'ordre est conservé après rechargement de page.
- [ ] La barre de progression d'un projet reflète le ratio tâches terminées / total en temps réel.
- [ ] L'application est entièrement fonctionnelle hors connexion (pas d'appel réseau).
- [ ] L'interface est utilisable sur mobile (375 px) sans scroll horizontal.
- [ ] Aucune donnée n'est perdue lors d'un rechargement complet de la page.
- [ ] La création d'une tâche sans titre affiche un message d'erreur et bloque la soumission.

---

## Prompt de démarrage

> Tu vas générer une application web complète appelée **FocusDesk**, une ToDo List pour entrepreneurs.
> Utilise **Next.js 14 (App Router)**, **TypeScript strict**, **Tailwind CSS v3**, **Zustand** pour le state management et **localStorage** comme unique couche de persistance.
> Implémente les 3 routes (`/`, `/projects`, `/clients`), le modèle de données complet (Task, Project, Client), toute la logique métier en pseudo-code dans ce PRD, et les 4 écrans décrits.
> Le design doit être **premium, dark-mode par défaut**, avec des micro-animations fluides, une typographie moderne (Inter via Google Fonts) et une palette de couleurs cohérente (violet/indigo dominant).
> Génère **tous les fichiers nécessaires** (components, store, hooks, pages, layout) sans laisser de placeholder ni de TODO.
> Démarre le serveur de développement avec `npm run dev` à la fin.

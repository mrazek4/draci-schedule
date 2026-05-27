# Architektura — FBC Draci Říčany Scheduling App

## Co to je

Webová SPA aplikace pro správu týdenního rozvrhu tréninků a plánování soustředění.
Běží v prohlížeči, data se ukládají do cloudové databáze (Upstash Redis) — vidí je všichni
přihlášení uživatelé v reálném čase.

**Stack:** React 18 + Vite · @dnd-kit/core · ExcelJS · date-fns · Upstash Redis (via Vercel serverless)

---

## Přihlašování (Microsoft PKCE/OIDC)

Přihlášení probíhá přes firemní Microsoft účet (stejný jako Teams/Outlook).
Po kliknutí na „Přihlásit se" proběhne PKCE flow s Azure AD — bez externích knihoven,
celá logika je ručně napsaná v `authUtils.js`.

Po úspěšném přihlášení si appka uloží token do `sessionStorage` a zachová přihlášení
po dobu platnosti tokenu (~1 hodina).

| Soubor | Role |
|--------|------|
| [src/auth/authUtils.js](src/auth/authUtils.js) | PKCE challenge, token exchange, refresh |
| [src/auth/AuthProvider.jsx](src/auth/AuthProvider.jsx) | React kontext — zpřístupní `user` + `logout` celé appce |
| [src/auth/LoginPage.jsx](src/auth/LoginPage.jsx) | Přihlašovací obrazovka |
| [src/auth/useRole.js](src/auth/useRole.js) | Hooky `useRole()` a `useCanEdit()` |

---

## Role a oprávnění

| Role | Co může dělat |
|------|---------------|
| **Admin** | Edituje rozvrh + spravuje role ostatních uživatelů |
| **Editor / Výbor** | Edituje rozvrh (přidává, přesouvá, maže tréninky) |
| **Trenér** | Pouze prohlíží a exportuje (výchozí pro nové uživatele) |

Role jsou uloženy v databázi jako `{ email: role }`. Pokud ještě nikdo nemá roli
`admin`, aktuálně přihlášený uživatel se automaticky považuje za admina (bootstrap ochrana).

---

## Datový model

Všechna data jsou v jednom JSON objektu uloženém pod klíčem `draci-schedule-v7` v Redis.
Každá změna se okamžitě persistuje přes `/api/state` (Vercel serverless).

```
AppState {
  seasons:          [{ id, name }]
  currentSeasonId:  string
  trainingsBySeason: { [seasonId]: Training[] }
  teamsBySeason:    { [seasonId]: Team[] }
  halls:            Hall[]
  hallAvailabilities: HallAvailability[]
  camps:            Camp[]
  campActivities:   { [campId]: { [dateStr]: CampActivity[] } }
  userRoles:        { [email]: role }
  weekOffset:       number
}

Training    { id, teamIds[], hallId, dayOfWeek, startMinute, endMinute, note }
Team        { id, name, shortName, color }
Hall        { id, name, code, color }
HallAvailability { id, hallId, dayOfWeek, startMinute, endMinute }
Camp        { id, name, startDate, endDate, teamIds[] }
CampActivity { id, teamId, startMinute, endMinute, label, color? }
```

---

## Stavový management (AppContext)

`src/context/AppContext.jsx` je centrální mozek celé aplikace.
Obaluje celý strom komponent a exponuje data i CRUD akce přes `useApp()`.

**Hook `useServerStorage`** synchronizuje stav s Redis:
1. Načte data ze serveru při startu
2. Spustí migrace (přechod na nový formát dat) až po načtení
3. Každou změnu stavu zapíše zpět na server

**Dostupné akce z `useApp()`:**

| Skupina | Akce |
|---------|------|
| Tréninky | `addTraining`, `moveTraining`, `updateTraining`, `deleteTraining` |
| Haly | `addHall`, `updateHall`, `deleteHall`, `setHallAvailabilities` |
| Týmy | `addTeam`, `updateTeam`, `deleteTeam` |
| Sezony | `addSeason`, `deleteSeason`, `setCurrentSeason`, `importTrainings` |
| Soustředění | `addCamp`, `updateCamp`, `deleteCamp` |
| Camp aktivity | `addCampActivity`, `updateCampActivity`, `deleteCampActivity` |
| Uživatelé | `setUserRole`, `removeUserRole` |

---

## Dva hlavní pohledy

Aplikace má dva vzájemně se vylučující pohledy přepínané záložkami v sidebaru:

### 1. Rozvrh (schedule)

Týdenní opakující se rozvrh tréninků zobrazený jako CSS grid.

**Dva režimy sidebaru** (přepínač Týmy / Haly):

| Režim | Sidebar | Kalendář |
|-------|---------|----------|
| **Týmy** | Dlaždice týmů (drag source) | `CalendarGrid` — haly jako řádky, čas jako sloupce |
| **Haly** | Dlaždice hal (drag source) | `TeamCalendarGrid` — týmy jako řádky, čas jako sloupce |

Draggable → Droppable interakce:
- Tým tile → slot hala+den+čas → `addTraining` (nový trénink, bez modalu)
- Hala tile → slot tým+den+čas → `TrainingModal` (předvyplněná hala+tým+čas)
- Training block → jiný slot → `moveTraining` (zachová délku)

### 2. Soustředění (camp)

Denní program soustředění. Každé soustředění má konkrétní datum rozsah,
přiřazené týmy a na každý den vlastní seznam aktivit.

Grid: týmy jako řádky (Y) × 15minutové sloty jako sloupce (X).

Drag & drop: přetažení aktivity na jiný slot → `updateCampActivity` (zachová délku, může změnit i tým).

---

## Drag & drop architektura

Jeden `<DndContext>` v `App.jsx` obslouží všechny druhy přetahování:

```
Drag types (active.data.current.type):
  NEW_TRAINING          — tým tile → hall grid slot
  NEW_TRAINING_FROM_HALL — hall tile → team grid slot → otevře modal
  MOVE_TRAINING         — existující training block → jiný slot
  MOVE_CAMP_ACTIVITY    — camp activity block → jiný camp slot
```

Guard v `handleDragEnd`: `slot.available` musí být `true`; pro team-row sloty
navíc `slot.hallId` chybí → odmítne NEW_TRAINING a MOVE_TRAINING.

---

## Export

| Funkce | Soubor | Popis |
|--------|--------|-------|
| `exportToExcel` | exportUtils.js | Všechny tréninky sezony do .xlsx |
| `exportDailySchedule` | exportUtils.js | Jeden den rozvrhu — týmy jako skupiny sloupců (OD/DO/AKTIVITA) |
| `exportCampDay` | exportUtils.js | Jeden den soustředění — stejný formát jako denní rozvrh |

---

## Klíčové soubory

| Soubor | Co dělá |
|--------|---------|
| [src/App.jsx](src/App.jsx) | DndContext, globální stav pohledu, všechny modaly |
| [src/context/AppContext.jsx](src/context/AppContext.jsx) | Veškerá data + CRUD akce |
| [src/auth/AuthProvider.jsx](src/auth/AuthProvider.jsx) | Microsoft OIDC přihlášení |
| [src/auth/useRole.js](src/auth/useRole.js) | Role a oprávnění |
| [src/components/sidebar/Sidebar.jsx](src/components/sidebar/Sidebar.jsx) | Boční panel, přepínač pohledů |
| [src/components/calendar/CalendarGrid.jsx](src/components/calendar/CalendarGrid.jsx) | Rozvrh z pohledu hal |
| [src/components/calendar/TeamCalendarGrid.jsx](src/components/calendar/TeamCalendarGrid.jsx) | Rozvrh z pohledu týmů |
| [src/components/camp/CampGrid.jsx](src/components/camp/CampGrid.jsx) | Denní grid soustředění |
| [src/utils/exportUtils.js](src/utils/exportUtils.js) | Excel exporty |
| [api/state.js](api/state.js) | Serverless endpoint — čtení/zápis Redis |

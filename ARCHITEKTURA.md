# Jak funguje aplikace — FBC Draci Říčany

## Co to je

Webová aplikace pro správu rozvrhu tréninků. Běží v prohlížeči, data se ukládají
do cloudové databáze (Redis) — takže je vidí všichni přihlášení uživatelé v reálném čase.

---

## Přihlašování

Přihlášení funguje přes Microsoft účet (stejný jako Teams, Outlook).
Po kliknutí na "Přihlásit se" tě appka přesměruje na přihlašovací stránku Microsoftu,
a po úspěšném přihlášení tě vrátí zpátky. Appka si zapamatuje, kdo jsi, v prohlížeči
po dobu platnosti tokenu (většinou 1 hodina).

Klíčové soubory:
- [src/auth/authUtils.js](src/auth/authUtils.js) — komunikace s Microsoftem
- [src/auth/AuthProvider.jsx](src/auth/AuthProvider.jsx) — zpřístupní info o přihlášeném uživateli celé appce

---

## Role a oprávnění

Každý uživatel má jednu ze tří rolí podle svého emailu:

| Role | Co může dělat |
|------|---------------|
| **Admin** | Edituje rozvrh + přidává/odebírá role ostatním |
| **Editor** | Edituje rozvrh |
| **Trenér** | Pouze prohlíží rozvrh a exportuje (výchozí) |

Role se spravují v aplikaci přes menu "Správa uživatelů" (viditelné pouze pro admina).
Ukládají se do databáze jako `{ email: role }`.

Speciální případ: pokud v databázi zatím nikdo nemá roli admina,
aplikace automaticky považuje aktuálně přihlášeného uživatele za admina —
aby se nestal stav, kdy nikdo nemůže nic nastavit.

Klíčový soubor: [src/auth/useRole.js](src/auth/useRole.js)

---

## Data aplikace

Veškerá data (haly, týmy, tréninky, dostupnosti, role) jsou uložena
v jednom velkém objektu v cloudové databázi. Každá změna (přidání tréninku,
přesun, smazání) se okamžitě uloží.

Tréninky jsou rozdělené po sezonách — každá sezona má svůj seznam tréninků
i dostupností hal.

Klíčový soubor: [src/context/AppContext.jsx](src/context/AppContext.jsx)

---

## Kalendářní mřížka

Rozvrh je zobrazený jako tabulka: osy jsou čas (svisle) × den (vodorovně) × hala (sloupce).
Každý trénink je blok umístěný přesně na správnou pozici v tabulce.

Přesunutí tréninku funguje přetažením (drag & drop) — funguje jen pro uživatele
s rolí Editor nebo Admin.

---

## Klíčové soubory — přehled

| Soubor | Co dělá |
|--------|---------|
| [src/auth/authUtils.js](src/auth/authUtils.js) | Přihlašování přes Microsoft |
| [src/auth/AuthProvider.jsx](src/auth/AuthProvider.jsx) | Kdo jsem přihlášen |
| [src/auth/useRole.js](src/auth/useRole.js) | Jakou mám roli |
| [src/context/AppContext.jsx](src/context/AppContext.jsx) | Všechna data + akce |
| [src/components/calendar/CalendarGrid.jsx](src/components/calendar/CalendarGrid.jsx) | Zobrazení rozvrhu |
| [src/components/sidebar/Sidebar.jsx](src/components/sidebar/Sidebar.jsx) | Boční panel, tlačítka |
| [src/components/modals/UserModal.jsx](src/components/modals/UserModal.jsx) | Správa rolí uživatelů |
| [api/state.js](api/state.js) | Uložení dat do databáze |

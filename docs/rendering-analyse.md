# Multi-Agent Rendering Analyse
## Zwei-Experten-System: Performance-Kritiker & Rendering-Optimierer

**Projekt:** Multilinguale Full-Stack App
**Next.js Version:** 16.1.6
**Datum:** 30.03.2026

---

## Konzept

Zwei konkurrierende Experten-Rollen analysieren jede Route:

- **[KRITIKER]** — Skeptischer Performance-Ingenieur: misst, bewertet, hinterfragt
- **[OPTIMIERER]** — Next.js 16 Experte: schlägt konkrete Verbesserungen vor und verteidigt sie

---

## Route 1: `/images/[category]`

### [KRITIKER]

**Score: 8/10**
**IST-Zustand:** PPR via Cache Components — `'use cache'` auf DB-Funktion, `<Suspense>` um `<ImageCards>`, kein `revalidate`, kein `generateStaticParams`.

**Schwachstellen:**
- Kein Auth-Guard — unauthentifizierte User sehen alle Bildkarten ⚠️
- `cacheTag` / `cacheLife` nicht gesetzt — Cache läuft nie ab, Änderungen in MongoDB werden nicht sichtbar bis zum nächsten Build
- `getImageCardsByCategory` cached pro Kategorie, aber keine Cache-Invalidierung möglich

**Server-Kosten pro Request:** Tief (statische Shell sofort, DB nur beim ersten Request)
**Mögliche Metriken-Verbesserung bei Fix:** TTFB bleibt tief, Auth-Check erhöht TTFB minimal (~5–10ms)

---

### [OPTIMIERER]

**SOLL-Zustand:** PPR beibehalten, `cacheLife` ergänzen, Auth-Guard prüfen.

```typescript
// lib/images.ts
import { cacheLife } from "next/dist/server/use-cache/cache-life";

export async function getImageCardsByCategory(category: string) {
  "use cache";
  cacheLife("days"); // Cache explizit auf 24h setzen
  const docs = await (db as any).images.findMany({ where: { category }, ... });
  // ...
}
```

Auth-Guard hängt vom fachlichen Entscheid ab: Sind Bildkarten öffentlich zugänglich? Falls ja → kein Guard nötig. Falls nein → `auth()` + Redirect hinzufügen.

**Metriken:** TTFB bleibt tief. Cache ist kontrollierbar.
**Risiko:** Niedrig

---

### [KRITIKER hinterfragt]

> "Du sagst `cacheLife("days")` — aber was passiert wenn jemand eine neue Kategorie in MongoDB einfügt? Die Route kennt sie nicht, weil kein `generateStaticParams` mehr existiert. Ist das gewollt?"

---

### [OPTIMIERER antwortet]

Ja, das ist ein bewusster Trade-off mit PPR: Neue Kategorien werden beim nächsten Aufruf zur Laufzeit gerendert und gecacht — ohne Rebuild. Das ist sogar ein Vorteil gegenüber SSG. Falls gewünscht, könnte man `cacheTag("images")` setzen und per API-Route gezielt revalidieren.

### FINALE EMPFEHLUNG

PPR beibehalten ✅ — `cacheLife("days")` ergänzen, Auth-Guard fachlich klären ⚠️

---

## Route 2: `/jokes/[language]`

### [KRITIKER]

**Score: 5/10**
**IST-Zustand:** PPR (durch globales `cacheComponents: true`) — aber `getJokesForLanguage` hat kein `'use cache'`. Der DB-Call läuft bei jedem Request.

**Schwachstellen:**
- DB-Funktion nicht gecacht → bei jedem Request ein MongoDB-Query
- Die gesamte Seite hat keine Suspense-Boundary → `<ImageCards>`-Muster wurde hier nicht übernommen
- Kein Auth-Guard — öffentlich zugänglich
- `revalidate = 3600` wurde entfernt, aber kein Ersatz gesetzt

**Server-Kosten pro Request:** Hoch (DB-Call bei jedem Request, keine Wiederverwendung)
**Mögliche Verbesserung:** TTFB sinkt stark wenn DB-Call gecacht wird

---

### [OPTIMIERER]

**SOLL-Zustand:** Gleiche PPR-Struktur wie `/images/[category]` anwenden — `'use cache'` auf die DB-Funktion, `<Suspense>` in der Page.

```typescript
// lib/jokes.ts
export async function getJokesForLanguage(language: string) {
  "use cache";
  cacheLife("hours"); // Witze ändern sich selten
  return await db.jokes.findMany({ where: { language } });
}

// jokes/[language]/page.tsx
export default async function JokesByLanguagePage({ params }) {
  const { language } = await params;
  const pretty = language.charAt(0).toUpperCase() + language.slice(1);

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">{pretty} Jokes</h1>
      <Suspense fallback={<p className="text-gray-400 animate-pulse">Witze werden geladen…</p>}>
        <JokesList language={pretty} />
      </Suspense>
    </div>
  );
}

async function JokesList({ language }: { language: string }) {
  const jokes = await getJokesForLanguage(language);
  if (!jokes.length) return <p className="text-red-500">No jokes found.</p>;
  return <JokesCarousel jokes={jokes} />;
}
```

**Metriken:** TTFB sinkt stark (statische Shell sofort), DB-Call nur beim ersten Request pro Sprache
**Risiko:** Niedrig

---

### [KRITIKER hinterfragt]

> "Du wechselst von `revalidate = 3600` (ISR) zu `cacheLife("hours")` (PPR). Das war vorher bewusst auf 1h gesetzt. Warum soll das besser sein?"

---

### [OPTIMIERER antwortet]

`revalidate = 3600` mit ISR rerendert die gesamte Seite alle 1h im Hintergrund — auch wenn sich nichts geändert hat. `cacheLife("hours")` + `'use cache'` cachet nur den DB-Call, nicht den ganzen Render-Prozess. Das ist granularer und effizienter.

### FINALE EMPFEHLUNG

`'use cache'` + Suspense-Struktur wie bei `/images/[category]` übernehmen ✅ — dies war der fehlende Schritt nach dem Entfernen von `revalidate`

---

## Route 3: `/[language]/exercises/[exerciseType]`

### [KRITIKER]

**Score: 7/10**
**IST-Zustand:** PPR mit `connection()` → erzwingt dynamisches Rendering. `auth()` und `cookies()` vorhanden. Mehrere DB-Calls, teils user-spezifisch (Vocabulary, Puzzle übergeben `session.user?.id`).

**Schwachstellen:**
- `connection()` macht die gesamte Seite dynamisch — kein statischer Shell möglich
- `Math.random()` und `Date.now()` für Exercise-IDs → inherent dynamisch, korrekt so
- `cookies()` für `userLocale` → dynamisch, korrekt so
- Kein Caching auf den DB-Calls möglich da user-spezifisch

**Server-Kosten pro Request:** Hoch (mehrere DB-Calls, Auth-Check, Cookie-Lesen)
**Mögliche Verbesserung bei Fix:** Generische DB-Calls (Sprachen, Konjugationen) könnten gecacht werden

---

### [OPTIMIERER]

**SOLL-Zustand:** SSR beibehalten (`connection()`), aber generische DB-Calls mit `'use cache'` optimieren.

```typescript
// lib/languages.ts
export async function getLanguageByName(name: string) {
  "use cache";
  cacheLife("max"); // Sprachen ändern sich nie
  return await db.languages.findFirst({ where: { name } });
}

// lib/conjugations.ts — getRandomConjExercises NICHT cachen
// (Math.random() soll bei jedem Request neu shufflen)
```

Die Page selbst bleibt dynamisch (SSR via `connection()`), aber Sprach-Lookups werden gecacht.

**Metriken:** TTFB leicht verbessert durch gecachte Sprach-Lookups (~20–50ms gespart)
**Risiko:** Niedrig für `getLanguageByName`, Mittelhoch bei user-spezifischen Calls

---

### [KRITIKER hinterfragt]

> "Die Route redirectet unauthentifizierte User zu `/sign-in` — aber was wenn `connection()` durch eine Auth-Middleware bereits abgedeckt ist? Ist der Double-Check in der Page redundant?"

---

### [OPTIMIERER antwortet]

Nein, nicht redundant. Middleware schützt auf Routing-Ebene, `auth()` in der Page schützt auf Daten-Ebene (Defense in Depth). Beide Schichten sind Best Practice. Middleware kann konfiguriert werden und Fehler haben — der Page-Guard ist die letzte Verteidigungslinie.

### FINALE EMPFEHLUNG

SSR via `connection()` ist korrekt ✅ — `getLanguageByName` mit `'use cache'` optimieren, user-spezifische Calls nicht cachen

---

## Route 4: `/[language]`

### [KRITIKER]

**Score: 6/10**
**IST-Zustand:** PPR (global) — `auth()` Check, dann `LanguagePageContent` mit `language` Prop. Kein DB-Call.

**Schwachstellen:**
- `auth()` macht diese Route dynamisch — aber es gibt keinen DB-Call danach
- Die eigentliche Seite ist nur ein "Container" der die Sprache weitergibt
- `params` wird als `const selectedLanguage = await params` ohne Destrukturierung gelesen — `selectedLanguage.language` statt direktem `language`

**Server-Kosten pro Request:** Mittel (nur Auth-Check, kein DB-Call)
**Mögliche Verbesserung:** Wenn `LanguagePageContent` keine dynamischen Daten hat → SSG denkbar

---

### [OPTIMIERER]

**SOLL-Zustand:** SSR via `connection()` explizit machen (auth-abhängig), params sauber destrukturieren.

```typescript
import { connection } from "next/server";

export default async function Page({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  await connection(); // explizit dynamisch wegen auth()
  const session = await auth();
  if (!session) redirect("/sign-in");

  const { language } = await params; // sauberere Destrukturierung
  return <LanguagePageContent language={language} />;
}
```

**Metriken:** Minimal. TTFB bleibt gleich.
**Risiko:** Niedrig

---

### [KRITIKER hinterfragt]

> "Was macht `LanguagePageContent` eigentlich? Falls es ein Client Component ist das keine Daten lädt, wäre die Route mit PPR + `<Suspense>` effizienter als vollständig dynamisch."

---

### [OPTIMIERER antwortet]

Guter Punkt. Falls `LanguagePageContent` ein reines Client Component ist (Sprachauswahl UI), könnte die Seite PPR-mässig strukturiert werden: statische Shell rendert sofort, `LanguagePageContent` streamt nach. Aber ohne Auth wäre der Zugang offen — der Auth-Check muss vor dem Rendering stehen. Aktuelles SSR ist daher vertretbar.

### FINALE EMPFEHLUNG

SSR korrekt wegen Auth ✅ — `connection()` explizit hinzufügen, params sauber destrukturieren (Minor Fix)

---

## Route 5: `/profile`

### [KRITIKER]

**Score: 9/10**
**IST-Zustand:** PPR (global) — `auth()` Check, `getUserProfile(session.user?.id)` — user-spezifischer DB-Call, kein Caching.

**Schwachstellen:**
- Kein `connection()` — die Route ist durch `auth()` zwar dynamisch, aber implizit. Besser explizit.
- `getUserProfile` könnte theoretisch gecacht werden, aber da user-spezifisch ist das nicht sinnvoll
- Fast perfekte Implementierung

**Server-Kosten pro Request:** Mittel (Auth + 1 DB-Call)

---

### [OPTIMIERER]

**SOLL-Zustand:** `connection()` explizit hinzufügen für Klarheit, sonst keine Änderung nötig.

```typescript
import { connection } from "next/server";

export default async function Page() {
  await connection();
  const session = await auth();
  if (!session) redirect("/sign-in");

  const user = await getUserProfile(session.user?.id || "");
  if (!user) return notFound();

  return <ProfilePageContent userProfile={user} />;
}
```

**Metriken:** Keine Änderung. Nur Klarheit.
**Risiko:** Minimal

---

### [KRITIKER hinterfragt]

> "Warum nicht PPR für `/profile`? Der statische Header `<h1>Dein Profil</h1>` könnte sofort gerendert werden, die User-Daten kommen per Suspense nach."

---

### [OPTIMIERER antwortet]

Theoretisch möglich, praktisch unnötig. Das Profile lädt schnell (1 DB-Call). PPR würde hier nur Layout-Shift erzeugen (leerer Header → Profildaten erscheinen). Der Nutzen ist minimal, der Code würde komplexer. SSR ist hier die richtige Wahl.

### FINALE EMPFEHLUNG

SSR ist optimal ✅ — `connection()` ergänzen für explizite Klarheit

---

## Route 6: `/sign-in` und `/sign-up`

### [KRITIKER]

**Score: 4/10**
**IST-Zustand (beide):** PPR (global) — `auth()` Check am Anfang (redirect wenn eingeloggt), dann statisches Formular.

**Schwachstellen `/sign-in`:**
- `auth()` beim Aufruf der Seite macht sie vollständig dynamisch — aber die Seite ist ein statisches Formular
- Das Formular selbst ändert sich nie → müsste SSG sein
- Der `auth()` Check beim GET-Request ist ein Anti-Pattern: Sessions sollten per Middleware geprüft werden, nicht in der Page
- `executeAction` mit `"use server"` in der Form-Action ist korrekt ✅

**Schwachstellen `/sign-up`:**
- Gleiche Problematik: `auth()` macht statisches Formular dynamisch
- `<SignupForm />` ist ein Client Component — statisches Rendering wäre möglich

**Server-Kosten pro Request:** Mittel (nur wegen unnötigem `auth()` Call)

---

### [OPTIMIERER]

**SOLL-Zustand:** Auth-Check in Middleware auslagern, Pages als statisch belassen.

```typescript
// middleware.ts — Auth-Redirect hier, nicht in den Pages
export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/((?!sign-in|sign-up|api/auth|_next).*)",
  ],
};

// sign-in/page.tsx — OHNE auth() Call
export default function Page() {
  return (
    <div className="w-5/6 m-auto">
      {/* statisches Formular */}
    </div>
  );
}
```

Mit diesem Ansatz wären `/sign-in` und `/sign-up` vollständig statisch (○ SSG im Build-Output). TTFB nahe 0ms.

**Metriken:** TTFB von ~50–100ms auf ~5ms, FCP dramatisch verbessert
**Risiko:** Mittel — Middleware-Konfiguration muss alle geschützten Routen korrekt abdecken

---

### [KRITIKER hinterfragt]

> "Das ist ein grosser Umbau. Was wenn die Middleware fehlschlägt oder falsch konfiguriert ist? Dann können eingeloggte User die Sign-In-Seite sehen — kein Sicherheitsproblem, aber UX-Problem."

---

### [OPTIMIERER antwortet]

Korrekt, deshalb Risiko: Mittel. Alternative: `connection()` hinzufügen + `auth()` beibehalten, aber das löst das Performance-Problem nicht. Für eine Auth-Seite ist statisches Rendering mit Middleware-Schutz der Industry Standard (z.B. Clerk, NextAuth Docs). Der Umbau ist sinnvoll aber ausserhalb des PPR-Scope dieser Thesis.

### FINALE EMPFEHLUNG

Kurzfristig `connection()` ergänzen ✅ — Mittelfristig Middleware-Ansatz für echtes SSG ⭐

---

## Route 7: `/`

### [KRITIKER]

**Score: 6/10**
**IST-Zustand:** PPR (global) — `auth()` Check, dann `HomepageContent`. Kein DB-Call, kein `connection()`.

**Schwachstellen:**
- `auth()` macht die Homepage vollständig dynamisch — dabei ist der Inhalt statisch
- `HomepageContent` ist sehr wahrscheinlich ein reines Client Component (Navigation, UI)
- Kein `connection()` — dynamisches Verhalten ist nur implizit durch `auth()`
- Die Homepage ist die meistbesuchte Route der App → Performance-Auswirkung am grössten

**Server-Kosten pro Request:** Mittel (nur Auth-Check, kein DB-Call)

---

### [OPTIMIERER]

**SOLL-Zustand:** `connection()` explizit hinzufügen. Mittelfristig: Auth-Check in Middleware, Homepage als SSG.

```typescript
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import HomepageContent from "@/components/HomepageContent";

const Page = async () => {
  await connection();
  const session = await auth();
  if (!session) redirect("/sign-in");

  return <HomepageContent />;
};
```

**Mittelfristig (Middleware-Ansatz):**
Wenn der Auth-Check in die Middleware ausgelagert wird, könnte die Homepage vollständig statisch (SSG, ○) sein — TTFB nahe 0ms.

**Metriken:** Kurzfristig minimal. Mittelfristig: TTFB und FCP stark verbessert.
**Risiko:** Niedrig (kurzfristig) / Mittel (Middleware-Umbau)

---

### [KRITIKER hinterfragt]

> "Die Homepage ist die Einstiegsseite der App und wird am häufigsten aufgerufen. Ein `auth()` Call bei jedem Besuch — ist das nicht der teuerste Fehler in der ganzen App?"

---

### [OPTIMIERER antwortet]

Ja, aus Performance-Sicht ist das der grösste Quick Win. Eine statische Homepage mit Middleware-Schutz würde den Server bei jedem Kaltstart entlasten. Für die Thesis: dies ist ein gutes Beispiel dafür, dass `cacheComponents: true` allein nicht ausreicht — die Rendering-Strategie muss pro Route bewusst gewählt werden.

### FINALE EMPFEHLUNG

`connection()` ergänzen ✅ — Middleware-Ansatz für SSG hat den grössten Performance-Impact der gesamten App ⭐

---

## Route 8: `/images`

### [KRITIKER]

**Score: 6/10**
**IST-Zustand:** PPR (global) — `auth()` Check, dann `ImagesMenuContent`. Kein DB-Call.

**Schwachstellen:**
- `auth()` macht eine statische Übersichtsseite dynamisch
- `ImagesMenuContent` zeigt wahrscheinlich eine Liste von Kategorien (office_supplies, animals, food etc.) — diese sind hardcoded oder statisch
- Kein `connection()` — dynamisch nur implizit
- Gleiche Problematik wie `/` und `/[language]`

**Server-Kosten pro Request:** Mittel (nur Auth-Check)

---

### [OPTIMIERER]

**SOLL-Zustand:** `connection()` explizit hinzufügen. Falls Kategorienliste statisch ist → mittelfristig SSG via Middleware.

```typescript
import { connection } from "next/server";

export default async function ImagesMenuPage() {
  await connection();
  const session = await auth();
  if (!session) redirect("/sign-in");

  return <ImagesMenuContent />;
}
```

**Metriken:** Kurzfristig minimal. Mittelfristig: TTFB verbessert wenn SSG.
**Risiko:** Niedrig

---

### [KRITIKER hinterfragt]

> "Wenn die Kategorienliste (office_supplies, animals etc.) hardcoded ist, warum wird die Seite nicht zur Build-Zeit gerendert?"

---

### [OPTIMIERER antwortet]

Einzig wegen `auth()` in der Page. Das ist das strukturelle Problem dieser drei Übersichts-Seiten (`/`, `/images`, `/jokes`): inhaltlich statisch, aber durch den Auth-Check künstlich dynamisch gemacht. Der Middleware-Ansatz löst genau das.

### FINALE EMPFEHLUNG

`connection()` ergänzen ✅ — Strukturell identisch mit `/` und `/jokes`, gleiche Empfehlung

---

## Route 9: `/jokes`

### [KRITIKER]

**Score: 6/10**
**IST-Zustand:** PPR (global) — `auth()` Check, dann `JokesContent`. Kein DB-Call.

**Schwachstellen:**
- Identisches Muster wie `/images` und `/`: `auth()` macht statische Übersichtsseite dynamisch
- `JokesContent` zeigt wahrscheinlich eine Sprachauswahl (DE, EN, ES, IT, FR) — vollständig statisch
- Kein `connection()` — dynamisch nur implizit

**Server-Kosten pro Request:** Mittel (nur Auth-Check)

---

### [OPTIMIERER]

**SOLL-Zustand:** Identisch mit `/images` — `connection()` kurzfristig, SSG via Middleware mittelfristig.

```typescript
import { connection } from "next/server";

export default async function Page() {
  await connection();
  const session = await auth();
  if (!session) redirect("/sign-in");

  return <JokesContent />;
}
```

**Metriken:** Kurzfristig minimal. Mittelfristig: TTFB verbessert.
**Risiko:** Niedrig

---

### [KRITIKER hinterfragt]

> "Drei Routen (`/`, `/images`, `/jokes`) haben exakt dasselbe Problem. Wäre es nicht sinnvoller, das als architekturelles Muster zu benennen statt jede Route einzeln zu behandeln?"

---

### [OPTIMIERER antwortet]

Absolut. Diese drei Routen bilden ein eigenes Muster: **"Statische Auth-Shell"** — Seiten die keinen DB-Call benötigen, aber trotzdem dynamisch sind wegen `auth()`. Die einheitliche Lösung ist ein Middleware-Schutz für alle (main)-Routen. Das wäre ein einziger Umbau mit Wirkung auf alle drei Seiten gleichzeitig.

### FINALE EMPFEHLUNG

`connection()` ergänzen ✅ — Muster "Statische Auth-Shell" als architekturelle Schwachstelle für die Thesis dokumentieren ⭐

---

## Gesamtauswertung

### Tabellarische Übersicht aller Routen

| Route | IST | Score (1–10) | SOLL | Priorität | Risiko |
|-------|-----|:------------:|------|:---------:|--------|
| `/images/[category]` | PPR ✅ | 8/10 | PPR + `cacheLife` | P2 | Niedrig |
| `/jokes/[language]` | PPR (unkorrekt) | 5/10 | PPR + `'use cache'` + Suspense | **P1** | Niedrig |
| `/[language]/exercises/[exerciseType]` | SSR via `connection()` | 7/10 | SSR + `'use cache'` auf Sprach-Lookups | P2 | Niedrig |
| `/[language]` | SSR (implizit) | 6/10 | SSR + `connection()` explizit | P3 | Minimal |
| `/profile` | SSR ✅ | 9/10 | SSR + `connection()` | P3 | Minimal |
| `/sign-in` + `/sign-up` | SSR (unnötig) | 4/10 | SSG via Middleware | P2 | Mittel |
| `/` | SSR (implizit) | 6/10 | SSR + `connection()` / SSG via Middleware | **P1** | Niedrig / Mittel |
| `/images` | SSR (implizit) | 6/10 | SSR + `connection()` / SSG via Middleware | P2 | Niedrig / Mittel |
| `/jokes` | SSR (implizit) | 6/10 | SSR + `connection()` / SSG via Middleware | P2 | Niedrig / Mittel |

---

### Priorisierte To-Do Liste

**P1 — Sofort:**
- `/jokes/[language]`: `'use cache'` auf `getJokesForLanguage` + Suspense-Struktur ergänzen (fehlender Schritt nach ISR-Entfernung)

**P2 — Bald:**
- `/images/[category]`: `cacheLife("days")` setzen für kontrolliertes Cache-Ablaufen
- `/[language]/exercises/[exerciseType]`: `getLanguageByName` mit `'use cache'` + `cacheLife("max")` cachen
- `/sign-in` + `/sign-up`: Auth-Check in Middleware auslagern → statische Formulare

**P3 — Optional / Nice-to-have:**
- `/[language]`: `connection()` explizit hinzufügen, params sauber destrukturieren
- `/profile`: `connection()` für Klarheit ergänzen

---

### Gesamteinschätzung: Welche Strategie dominiert?

**Dominierende Strategie: PPR (◐)** — durch `cacheComponents: true` sind alle Routen als PPR markiert, aber nur `/images/[category]` ist vollständig korrekt als PPR implementiert.

**Ist das sinnvoll für eine Auth-geschützte Lernplattform?**

Nicht vollständig. Die Realität der App zeigt eine klare Aufteilung:

| Routen-Typ | Routen | Optimale Strategie |
|-----------|--------|-------------------|
| Auth-geschützt, user-spezifische Daten | `/profile`, `/exercises` | **SSR** |
| Auth-geschützt, reine Navigation | `/[language]` | **SSR** |
| Öffentliche Katalogdaten | `/images/[category]`, `/jokes/[language]` | **PPR** ✅ |
| Öffentliche statische Formulare | `/sign-in`, `/sign-up` | **SSG** (derzeit SSR) |

`cacheComponents: true` als globale Einstellung passt gut zu den Katalog-Routen und ist für Auth-Routen neutraler Overhead — dort ist die statische Shell minimal und der PPR-Nutzen gering. Die App profitiert am meisten von PPR bei `/images` und `/jokes`, und von konsequentem SSR bei allen Auth-abhängigen Routen.

**Fazit:** Eine hybride Strategie ist korrekt — globales `cacheComponents: true` mit gezieltem `'use cache'` auf DB-Funktionen ist der empfohlene Ansatz für Next.js 16 in einer Auth-geschützten Lernplattform.

# Hey Milano — Dashboard del percorso

Sito statico **interno al Comitato Promotore** di *Hey Milano, dove andiamo?*. Mostra in modo coordinato:

- **I numeri** delle assemblee (svolte, confermate, in pipeline, annullate)
- L'**indice di tutte le assemblee**, ognuna cliccabile sulla pagina pubblica di Notion
- I **contributi raccolti** (vocali, verbali, documenti) annidati sotto la rispettiva assemblea
- I **temi emersi** dal percorso, con frequenza in base ad assemblee e contributi
- Banner finale verso il **Congresso per la Città — 23 maggio 2026**

Palette e tipografia coordinate con il logo Hey Milano (nero pieno + arancione `#ED9220`).

---

## Struttura

```
dashboard/
├── index.html
├── assets/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── main.js
│   └── data/
│       └── data.js
└── README.md
```

Una sola dipendenza esterna via CDN: **Chart.js 4.4.1** per i due grafici (donut e bar).
Niente build, niente npm: si apre `index.html` e funziona.

---

## Aggiornare i dati

Tutti i dati sono dentro `assets/data/data.js` come oggetto JavaScript `window.HM_DATA` con tre array:

- `assemblee` — una voce per ogni assemblea (campi: `nome`, `data`, `luogo`, `promotore`, `stato`, `sito`, `temi`, `url`)
- `contributi` — una voce per ogni contributo (campi: `nome`, `data`, `tipo`, `priorita`, `fonte`, `temi`, `assembleaUrl`, `url`, `sintesi`)
- `temi` — i 15 temi chiave con il loro colore

Per **collegare un contributo a un'assemblea**: imposta il campo `assembleaUrl` del contributo uguale al campo `url` dell'assemblea. Apparirà annidato sotto.

Quando aggiorni i database Notion, è sufficiente:

1. esportare i dati aggiornati (o copiarli a mano)
2. modificare `assets/data/data.js`
3. fare commit e push: GitHub Pages ricostruisce automaticamente

In una versione futura si può collegare direttamente l'API di Notion con uno script di build (GitHub Action) che rigenera `data.js` ogni notte.

---

## Deploy su GitHub Pages

1. Crea un repository su GitHub, ad esempio `heymilano-dashboard` (può essere **privato** se ti basta condividere il link con chi è invitato; oppure pubblico).
2. Copia il contenuto di questa cartella nella root del repository.
3. Commit e push.
4. Vai su **Settings → Pages**, sezione *Build and deployment*:
   - **Source**: Deploy from a branch
   - **Branch**: `main`, cartella `/ (root)`
5. Clicca **Save**. Dopo qualche secondo il sito è disponibile a `https://<tuo-username>.github.io/heymilano-dashboard/`.

Per un dominio personalizzato (es. `dashboard.heymilano.it`) basta aggiungere un file `CNAME` con il dominio e configurare il record DNS.

---

## Privacy / accesso

La dashboard è **interna**: contiene anche assemblee private e contributi non ancora pubblicabili. Tre opzioni:

1. **Repository privato + GitHub Pages**: richiede un piano GitHub a pagamento (Pages su repo privati è feature di GitHub Enterprise/Pro).
2. **Sito pubblico ma `noindex`**: già configurato (`<meta name="robots" content="noindex,nofollow">`). Chiunque conosce l'URL può vederlo, ma non finisce nei motori di ricerca. È la soluzione più rapida.
3. **Sito pubblico filtrato**: rimuovi da `data.js` le assemblee con `sito = "Non pubblicare"` o stato `Annullata` se non vuoi che siano visibili.

I link nelle card portano direttamente alle pagine Notion: assicurati che le pagine siano effettivamente *condivise pubblicamente* (workspace impostato su «Share to web»). In caso contrario chi clicca trova una schermata di accesso.

---

## Personalizzazioni rapide

- **Colori**: tutto in `:root` di `style.css` (variabili CSS). L'arancione del logo è `--accent: #ED9220`.
- **Aggiornare i KPI**: i numeri sono calcolati a runtime dai dati; ti basta aggiornare `data.js`.
- **Cambiare il logo**: sostituisci l'SVG inline nell'`<header>` di `index.html` (o nel favicon `data:image/svg+xml`).
- **Disabilitare i grafici**: rimuovi lo `<script>` di Chart.js dall'`<head>`. La sezione "Temi" mostra comunque le barre senza dipendenze esterne.

---

## Coordinatori workspace

- Danilo Aprigliano
- Raffaele Di Tria
- Mauro Mercatanti — comunicazione
- Franco D'Alfonso — Caldara

Workspace Notion di riferimento: <https://www.notion.so/daniloaprigliano/Hey-Milano-Workspace-2234d250dea740eb9f025a2f60c983a9>

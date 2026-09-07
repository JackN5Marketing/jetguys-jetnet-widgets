# JetGuys — JETNET widgets

Netlify Functions proxy + tri nezavisna embeddable JS widgeta koji na
JetGuys Webflow sajtu prikazuju JETNET Connect podatke po modelu aviona:
tržišni trendovi (market trends), događaji (events) i retail transakcije
(history). Svaki widget je samostalan -- ima svoju pretragu modela i može
da se ubaci bilo gde, nezavisno od ostalih.

## Arhitektura

```
netlify/functions/
  lib/jetnet.js        login + token cache (Netlify Blobs) + response-status provera
  lib/http.js          CORS + JSON helperi
  models.js            GET  /models?q=citation&limit=15        -> autocomplete pretraga modela
  market-trends.js     GET  /market-trends?modelid=40&months=12 -> getModelMarketTrends
  events.js            GET  /events?modelid=40&days=180         -> getEventListPaged
  history.js           GET  /history?modelid=40&months=12       -> getHistoryListPaged (retail filter)
public/
  widget-market-trends.js   samostalan widget -- pretraga modela + Market Trends panel
  widget-events.js          samostalan widget -- pretraga modela + Recent Events panel
  widget-history.js         samostalan widget -- pretraga modela + Retail Transactions panel
  index.html                lokalna test stranica, sva tri widgeta jedno ispod drugog
```

JETNET email/password nikad ne izlaze iz Netlify funkcija -- Webflow zove
samo naše `/.netlify/functions/*` endpointe, koji drže i osvežavaju
`bearerToken`/`apiToken` u Netlify Blobs storage-u (traju ~60 min).

## Stil (brend)

Svaki widget je zasebna kartica: bela pozadina, `border-radius: 14px`,
border `rgba(0, 0, 0, 0.15)`. Akcenat boja je brend žuta `#b59e27`
(naslovi, fokus na search polju, header tabela, hover stanja), tekst crn
`#111`, sekundarni tekst siv. Stranica/sekcija na kojoj se widgeti ubacuju
treba da ima belu pozadinu da se kartice lepo ističu.

## Deploy na Netlify

1. Push ovaj repo na GitHub (ili `netlify deploy` direktno iz foldera ako
   imaš Netlify CLI negde gde postoji Node.js).
2. Netlify > **Add new site > Import an existing project**, izaberi repo.
   - Build command: ostavi prazno (nema build koraka)
   - Publish directory: `public`
   - Functions directory: pokupiće se automatski iz `netlify.toml`
     (`netlify/functions`)
3. **Site settings > Environment variables**, dodaj:
   - `JETNET_EMAIL`
   - `JETNET_PASSWORD`
   - `ALLOWED_ORIGIN` -- domen Webflow sajta, npr. `https://www.jetguys.com`
     (dok testiraš možeš ostaviti `*`, suziti pre nego što ide live)
4. Netlify Blobs je automatski dostupan na svakom sajtu, nije potreban
   dodatni setup.
5. Klikni **Deploy site**. Netlify ti odmah daje `*.netlify.app` URL --
   to je već "live" i javno dostupno, samo pod Netlify domenom umesto
   `jetguys.com`.

### Kako odmah testirati da li radi

Čim se deploy završi, otvori `https://TVOJ-SAJT.netlify.app/` u browseru --
to je `public/index.html` sa sva tri widgeta. Ukucaj naziv modela (npr.
"Excel" ili "G650") u bilo koji od njih; ako se pojave predlozi i posle
klika učitaju podaci, cela veza JETNET → Netlify Function → widget radi.

Ako nešto ne radi:
- **Netlify Dashboard > Functions**, otvori log konkretne funkcije
  (`models`, `market-trends`, `events`, `history`) da vidiš grešku.
- Najčešći uzrok: `JETNET_EMAIL`/`JETNET_PASSWORD` nisu setovani ili su
  pogrešni -- login tada baca grešku vidljivu u function logu.
- Posle svake izmene environment varijable potrebno je pokrenuti novi
  deploy (**Deploys > Trigger deploy > Deploy site**) da je funkcije
  pokupe.

## Ugradnja u Webflow

Za svaki widget se dodaje poseban **Embed** element sa `<div>` + `<script>`
parom. Mogu da idu jedan ispod drugog na istoj stranici, u bilo kom
redosledu:

```html
<!-- Market Trends -->
<div
  data-jng-market-trends
  data-api-base="https://JETGUYS-NETLIFY-SITE.netlify.app/.netlify/functions"
></div>
<script src="https://JETGUYS-NETLIFY-SITE.netlify.app/widget-market-trends.js"></script>

<!-- Recent Events -->
<div
  data-jng-events
  data-api-base="https://JETGUYS-NETLIFY-SITE.netlify.app/.netlify/functions"
></div>
<script src="https://JETGUYS-NETLIFY-SITE.netlify.app/widget-events.js"></script>

<!-- Retail Transactions -->
<div
  data-jng-history
  data-api-base="https://JETGUYS-NETLIFY-SITE.netlify.app/.netlify/functions"
></div>
<script src="https://JETGUYS-NETLIFY-SITE.netlify.app/widget-history.js"></script>
```

Zameniti `JETGUYS-NETLIFY-SITE` stvarnim Netlify domenom (ili custom
domenom ako se doda). Svaki widget sam ubacuje svoj CSS -- staviti Embed
elemente na sekciju/stranicu sa belom pozadinom radi kontrasta sa karticom.

## Lokalno testiranje (kad ima Node.js)

```bash
npm install
npx netlify dev
```

Otvara `http://localhost:8888` sa `public/index.html`. Potreban je
`netlify link` ili lokalni `.env` sa `JETNET_EMAIL`/`JETNET_PASSWORD` da bi
funkcije radile.

## Poznata ograničenja / sledeći koraci

- `history` i `events` vraćaju prvih 200 zapisa po pozivu (nema "load more"
  paginacije u widgetu) -- dovoljno za prikaz na sajtu, ali ne za bulk izvoz.
- Rate limit na JETNET nalogu je ~60 req/min; server-side cache (30-60 min
  po endpointu) drži widgete daleko ispod toga i pri više istovremenih
  posetilaca.
- `ALLOWED_ORIGIN` treba suziti na stvarni Webflow domen pre produkcije.

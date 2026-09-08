# JetGuys — JETNET widgets

Netlify Functions proxy + četiri nezavisna embeddable JS widgeta koji na
JetGuys Webflow sajtu prikazuju JETNET Connect podatke: tržišni trendovi po
modelu (market trends), događaji po modelu (events), pretraga aviona po
registraciji (tail number lookup), i procena tržišne vrednosti po registraciji
(aircraft eValuation). Svaki widget je samostalan i može da se ubaci bilo gde,
nezavisno od ostalih.

> Retail Transactions (`getHistoryListPaged`) je uklonjen -- JETNET nalog
> vraća `ERROR: HISTORY NOT AVAILABLE FOR SUBSCRIPTION` (History nije deo
> trenutnog pretplatničkog nivoa). Zamenjen je Tail Number Lookup-om, koji
> je u osnovnom (Tier 1) nivou i radi bez ograničenja.

## Arhitektura

```
netlify/functions/
  lib/jetnet.js        login + in-memory token cache + response-status provera
  lib/http.js          CORS + JSON helperi
  models.js            GET  /models?q=citation&limit=15        -> autocomplete pretraga modela
  market-trends.js     GET  /market-trends?modelid=40&months=12 -> getModelMarketTrends
  events.js            GET  /events?modelid=40&days=180         -> getEventListPaged
  aircraft.js           GET  /aircraft?reg=N29ZR                 -> getRegNumber (tail lookup)
public/
  widget-market-trends.js   samostalan widget -- pretraga modela + Market Trends panel
  widget-events.js          samostalan widget -- pretraga modela + Recent Events panel
  widget-tail-lookup.js     samostalan widget -- unos registracije + podaci o avionu i vlasniku
  widget-eval.js            samostalan widget -- unos registracije + procena tržišne vrednosti (eValuation)
  widget-eval-hero.js       ista logika kao widget-eval.js, ali stilizovano za tamni hero (providan
                            "staklen" input + pill dugme), za ugradnju u postojeći search bar na
                            New Homepage hero-u ("Enter your aircraft tail number")
  index.html                lokalna test stranica, sva četiri widgeta jedno ispod drugog + hero varijanta
```

`widget-eval.js` ne dodaje novi backend endpoint -- lančano poziva već
postojeće `/aircraft` (resolve tail -> model) i `/market-trends` (raspon
cena za taj model) i prikazuje `low_asking_price`-`high_asking_price` kao
procenjeni raspon, uz kvalitativnu napomenu na osnovu `avg_year` iz JETNET-a
(da li je avion noviji/stariji od proseka flote). Namerno ne izmišlja
jedan tačan broj po serijskom broju -- History tier (uporedive prodaje)
nije u trenutnoj JETNET pretplati, pa je raspon tržišnog proseka jedina
podržana procena. Dugme "Request a Certified Appraisal" ima
`data-jg-open="appraisal-modal"` atribut -- kad je widget ubačen na pravi
JetGuys sajt, otvara postojeći sajtov lead-capture modal (ista JS logika
koja već pokreće modal iz header/footer dugmadi).

JETNET email/password nikad ne izlaze iz Netlify funkcija -- Webflow zove
samo naše `/.netlify/functions/*` endpointe, koji drže i osvežavaju
`bearerToken`/`apiToken` u memoriji funkcije (traju ~60 min). Keš je
per-container (resetuje se na cold start), što je dovoljno da drastično
smanji broj poziva ka JETNET-u bez ikakve dodatne Netlify konfiguracije.

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
4. Klikni **Deploy site**. Netlify ti odmah daje `*.netlify.app` URL --
   to je već "live" i javno dostupno, samo pod Netlify domenom umesto
   `jetguys.com`.

### Kako odmah testirati da li radi

Čim se deploy završi, otvori `https://TVOJ-SAJT.netlify.app/` u browseru --
to je `public/index.html` sa sva četiri widgeta. Ukucaj naziv modela (npr.
"Excel" ili "G650") u prva dva, ili registraciju (npr. "N29ZR") u treći i
četvrti; ako se pojave podaci, cela veza JETNET → Netlify Function → widget
radi.

Ako nešto ne radi:
- **Netlify Dashboard > Functions**, otvori log konkretne funkcije
  (`models`, `market-trends`, `events`, `aircraft`) da vidiš grešku.
- Najčešći uzrok: `JETNET_EMAIL`/`JETNET_PASSWORD` nisu setovani ili su
  pogrešni -- login tada baca grešku vidljivu u function logu.
- Greška tipa `ERROR: ... NOT AVAILABLE FOR SUBSCRIPTION` znači da taj
  endpoint nije uključen u JETNET pretplatu -- nije bug, treba proveriti
  nivo pretplate kod JETNET-a ako je taj podatak neophodan.
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
  data-api-base="https://the-jetguys-widgets.netlify.app/.netlify/functions"
></div>
<script src="https://the-jetguys-widgets.netlify.app/widget-market-trends.js"></script>

<!-- Recent Events -->
<div
  data-jng-events
  data-api-base="https://the-jetguys-widgets.netlify.app/.netlify/functions"
></div>
<script src="https://the-jetguys-widgets.netlify.app/widget-events.js"></script>

<!-- Tail Number Lookup -->
<div
  data-jng-tail-lookup
  data-api-base="https://the-jetguys-widgets.netlify.app/.netlify/functions"
></div>
<script src="https://the-jetguys-widgets.netlify.app/widget-tail-lookup.js"></script>

<!-- Aircraft eValuation -->
<div
  data-jng-eval
  data-api-base="https://the-jetguys-widgets.netlify.app/.netlify/functions"
></div>
<script src="https://the-jetguys-widgets.netlify.app/widget-eval.js"></script>

<!-- Aircraft eValuation -- dark hero variant -->
<div
  data-jng-eval-hero
  data-api-base="https://the-jetguys-widgets.netlify.app/.netlify/functions"
></div>
<script src="https://the-jetguys-widgets.netlify.app/widget-eval-hero.js"></script>
```

Za `widget-eval-hero.js`: na New Homepage-u zameniti postojeći statični
"Enter your aircraft tail number" search embed ovim -- vizuelno je
identičan (isti providni pill input, isto "GET YOUR APPRAISAL" dugme sa
strelicom), samo što sad stvarno radi. Rezultat se otvara ispod kao
"staklena" tamna kartica (`backdrop-filter: blur`), da se uklopi sa hero
pozadinskom slikom umesto da prekine dizajn belom karticom.

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

- `events` vraća prvih 200 zapisa po pozivu (nema "load more" paginacije u
  widgetu) -- dovoljno za prikaz na sajtu, ali ne za bulk izvoz.
- Rate limit na JETNET nalogu je ~60 req/min; server-side cache (10-60 min
  po endpointu) drži widgete daleko ispod toga i pri više istovremenih
  posetilaca.
- `ALLOWED_ORIGIN` treba suziti na stvarni Webflow domen pre produkcije.
- Retail Transactions se može vratiti kasnije ako se JETNET pretplata
  nadogradi na nivo koji uključuje History (`getHistoryListPaged`) --
  kod je i dalje u git istoriji ako zatreba.

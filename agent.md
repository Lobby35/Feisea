# Feisea · Context del projecte

Feisea és una borsa de treball. Els candidats creen el seu perfil, pengen el CV i es presenten a ofertes. Les empreses publiquen ofertes i gestionen les candidatures que reben. L’administració revisa les empreses i modera les ofertes.

## Rols i fluxos actuals

- **Públic**. Pot consultar i filtrar les ofertes publicades. La llista i el detall públics només inclouen ofertes amb data de publicació vigent, sense caducar i d’una empresa aprovada amb el compte actiu.
- **Candidat (`candidate`)**. Es registra amb un domini admès a `CANDIDATE_EMAIL_DOMAINS`, verifica el correu i completa el perfil. Pot gestionar la foto i el CV i demanar suggeriments de perfil extrets del CV. Per presentar una candidatura cal haver completat el perfil, disposar d’un CV i que l’oferta continuï admetent candidatures. Es desa una còpia del CV per a la candidatura i es comprova que el candidat encara no s’hagi presentat a l’oferta. El candidat pot consultar les seves candidatures i retirar-les mentre estiguin en estat `pending`, `reviewed` o `interview`.
- **Empresa (`company`)**. Es registra, verifica el correu i necessita l’aprovació administrativa per accedir al seu espai. Gestiona el seu perfil i les seves ofertes amb els estats `draft`, `published` i `closed`. Pot consultar les candidatures de les seves ofertes, descarregar el CV associat a cada candidatura, consultar notificacions i actualitzar l’estat a `pending`, `reviewed`, `interview`, `accepted` o `rejected`. La retirada pel candidat es desa com a `withdrawn`.
- **Administració (`admin`)**. Té un inici de sessió propi i un panell de resum. Revisa empreses amb els estats `pending`, `approved` i `blocked`, gestiona usuaris i pot llistar, tancar i eliminar ofertes.

**Aprovació d’ofertes**. El flux de negoci descrit preveu que l’administració també aprovi les ofertes. Al codi actual, una empresa aprovada pot publicar-les directament. `AdminOfferController` ofereix llistat, tancament i eliminació. L’aprovació prèvia de cada oferta queda pendent d’implementació.

## Arquitectura i mapa del repositori

| Ubicació | Responsabilitat |
| --- | --- |
| `backend/` | API JSON amb PHP 8.3, Laravel 12 i Eloquent. `routes/api.php` defineix les rutes sota `/api`. |
| `backend/app/Http/Controllers/` | `AuthController` i `ProfileSetupController` cobreixen l’accés i l’alta del perfil. `ProfileController` gestiona el perfil i els fitxers. `JobOfferController` i `ApplicationController` concentren els fluxos d’ofertes i candidatures. Els controladors `Admin*` són el punt d’entrada de l’administració. |
| `backend/app/Models/` | Entitats del domini i relacions. `User` representa el compte, amb `CandidateProfile` o `Company` segons el rol. `JobOffer` pertany a una empresa i `Application` vincula el candidat amb l’oferta. |
| `backend/config/feisea.php`, `backend/app/Rules/` | Configuració de l’aplicació i regles de compte. `OptionsController` exposa catàlegs a `GET /api/options`. Els estudis i municipis es poden localitzar a `backend/config/studies.php` i `backend/resources/data/municipalities.json`. |
| `backend/app/Services/`, `backend/app/Jobs/`, `backend/scripts/` | Servei de verificació, tasques de correu i extracció del CV amb `cv_extract.py`. La imatge del backend instal·la Python 3 i Poppler. |
| `frontend/` | React 19 i Vite 7 amb JavaScript i JSX. `src/main.jsx` inicia l’aplicació i `src/App.jsx` defineix la navegació. |
| `frontend/src/` | `api.js` centralitza les peticions. `context/AccountContext.jsx` i `components/AccountGuard.jsx` gestionen el compte i l’accés a la interfície. Les pantalles són a `pages/`, la funcionalitat per domini a `features/` i els estils generals a `styles/base.css`. |
| `database/schema.sql`, `backend/database/migrations/` | Esquema inicial PostgreSQL i migracions incrementals en SQL. `backend/routes/console.php` implementa `app:migrate` i `app:create-admin`. |
| `compose.yaml`, `docker/`, `deploy/nginx/` | Serveis, imatges i configuracions Nginx de desplegament. `frontend/nginx.conf.template` fa de proxy de `/api` cap al backend. |
| `tests/` | Proves d’integració en Python per als fluxos de compte, ofertes, candidatures i administració. `compose.auth.yaml` hi afegeix Mailpit i configura els ports de prova. |

## Contractes que cal preservar

- L’API és l’autoritat sobre els permisos. `AuthenticateSession` comprova la cookie de sessió, el compte actiu i verificat, el rol i l’aprovació de l’empresa. Les peticions autenticades que modifiquen dades requereixen `X-CSRF-Token`. `CheckOrigin` controla els orígens i `frontend/src/api.js` gestiona el token i fa peticions al mateix origen.
- Les accions sobre candidatures i les descàrregues de CV han de respectar la titularitat del candidat o de l’empresa que ha publicat l’oferta. Els fitxers es desen en emmagatzematge privat. La còpia del CV associada a una candidatura ha de continuar disponible encara que el candidat substitueixi el CV del perfil.
- Quan canviïs un estat, una validació o la forma d’una resposta, revisa conjuntament les restriccions SQL, el controlador, el client `api.js` i les pantalles afectades. Conserva el comportament amb les dades existents i comprova tant el cas permès com els accessos entre comptes.
- El contenidor PostgreSQL carrega `database/schema.sql` quan inicialitza un volum buit. A l’arrencada, el contenidor `api` executa `app:migrate`, que rellegeix les migracions SQL en ordre dins d’una transacció. Les migracions noves han de poder tornar-se a executar i aplicar-se sobre una base existent.

## Arrencada local

1. Crea el fitxer `.env` de l’arrel partint de `example.env`. Ajusta `APP_KEY`, les credencials, els ports, les adreces d’escolta, `APP_URL`, `APP_ALLOWED_ORIGINS` i la configuració de correu a l’entorn local. Les adreces LAN i Tailscale de l’exemple són específiques d’un host. Els bindings d’un mateix servei han de correspondre a adreces disponibles i no solapar-se.
2. Des de l’arrel, executa `docker compose up -d --build`. Els serveis són `db`, `api`, `mail-worker`, `frontend` i `pgadmin`. Les dades PostgreSQL i l’emmagatzematge de l’API tenen volums persistents.
3. Comprova l’estat amb `docker compose ps` i accedeix a `/api/health` des de l’origen del frontend. L’endpoint comprova la connexió amb PostgreSQL.
4. Per donar d’alta l’administrador, configura `ADMIN_EMAIL` i `ADMIN_PASSWORD` i executa `docker compose exec api php artisan app:create-admin`. Pots consultar les rutes amb `docker compose exec api php artisan route:list --path=api`.

Per compilar el frontend, executa `npm ci` i `npm run build` dins de `frontend/`. El script `npm run dev` serveix el frontend amb Vite. Per provar fluxos connectats a l’API, utilitza el frontend de Compose amb el proxy de mateix origen. Mantén les claus i credencials reals fora de Git.

## Verificació

Utilitza una pila de proves aïllada amb el fitxer base `compose.yaml` i la configuració addicional `tests/compose.auth.yaml`. Comprova que la pila tingui un administrador de prova creat amb `app:create-admin` i que el correu arribi a Mailpit. L’origen de prova del frontend és `http://127.0.0.1:18081` i Mailpit escolta a `http://127.0.0.1:18025`.

```sh
python3 tests/auth_smoke.py http://127.0.0.1:18081 http://127.0.0.1:18025
python3 tests/offers_smoke.py http://127.0.0.1:18081 http://127.0.0.1:18025
python3 tests/admin_smoke.py http://127.0.0.1:18081 http://127.0.0.1:18025
```

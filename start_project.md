# Arrencar Feisea en local

Executa les comandes des de l’arrel del projecte en un terminal WSL (Ubuntu), amb Docker en marxa. Si encara no tens el fitxer `.env`, crea’l amb `cp example.env .env` i adapta’l a l’entorn local. Cal configurar una `APP_KEY` vàlida i les contrasenyes abans d’arrencar.

## Backend i frontend

```bash
docker compose config --quiet
docker compose up -d --build --wait
docker compose ps
curl -fsS http://127.0.0.1:3000/api/health
```

El frontend és a [http://localhost:3000](http://localhost:3000). Les peticions a `/api` passen pel proxy del frontend. El backend també respon directament a `http://127.0.0.1:8001/api/health`. En arrencar, el backend aplica les migracions de la base de dades.

## Crear el compte administrador

Al `.env`, defineix `ADMIN_EMAIL` i `ADMIN_PASSWORD` abans d’arrencar. La contrasenya ha de tenir almenys 12 caràcters, amb majúscules, minúscules, números i símbols, i com a màxim 72 bytes.

```bash
docker compose exec api php artisan app:create-admin
```

Entra a [http://localhost:3000/admin/login](http://localhost:3000/admin/login) amb les credencials del `.env`. L’ordre crea el compte amb el correu verificat. Si ja existeix un administrador amb el mateix correu, aquesta ordre conserva la seva contrasenya. Si has editat el `.env` amb la pila en marxa, torna a executar `docker compose up -d --wait` perquè els contenidors carreguin els canvis abans de crear el compte.

## Configurar Gmail SMTP

Activa la verificació en dos passos al compte de Google que farà els enviaments i genera una contrasenya d’aplicació per a Feisea. [Ajuda de Google sobre contrasenyes d’aplicació](https://support.google.com/accounts/answer/185833)

Al `.env` de l’arrel, posa la mateixa adreça de Gmail a `MAIL_USERNAME` i `MAIL_FROM_ADDRESS`. Copia la contrasenya d’aplicació a `MAIL_PASSWORD` sense espais.

```dotenv
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SCHEME=smtp
MAIL_USERNAME=el-teu-compte@gmail.com
MAIL_PASSWORD='CONTRASENYA_D_APLICACIO'
MAIL_FROM_ADDRESS=el-teu-compte@gmail.com
MAIL_FROM_NAME=Feisea
```

Si el projecte ja està en marxa, aplica els canvis perquè l’API i el worker carreguin les variables noves.

```bash
docker compose up -d --wait
```

Per provar l’enviament, registra un compte amb una adreça que puguis consultar i obre l’enllaç del correu de verificació. Si et registres com a candidat, l’adreça ha de pertànyer a un domini admès per `CANDIDATE_EMAIL_DOMAINS`. Si el correu no arriba, revisa la carpeta de correu brossa i els logs del worker.

```bash
docker compose logs --tail=50 mail-worker
```

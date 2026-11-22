# Seguretat de Feisea

L’auditoria ha revisat les 50 rutes registrades de l’API i els punts d’entrada de React, Nginx, Apache, Docker Compose, Artisan, PostgreSQL, pgAdmin, el worker de correu i el processador de CV. En local, les 59 combinacions protegides de mètode i ruta, comptant `HEAD`, han respost `401` sense sessió tant pel frontend (3000) com per l’API directa (8001). Els endpoints públics de salut, opcions i llistat d’ofertes han respost `200`.

## Prioritat alta

### 1. Restringir els ports del desplegament

`compose.yaml` permet publicar PostgreSQL, pgAdmin i l’API directa en adreces de LAN i Tailscale. En la instància auditada els ports estaven vinculats a adreces loopback. La configuració `deploy/nginx/feisea.http.conf` permet servir l’aplicació per HTTP.

**Proposta.** En producció, publica només el proxy HTTPS. Conserva el port 80 per redirigir a HTTPS i servir el repte ACME si el desplegament el necessita. Treu les publicacions de PostgreSQL i l’API de la configuració de producció i mantén la comunicació per la xarxa interna de Compose. Si el proxy és extern a Compose, vincula l’upstream del frontend a una interfície accessible només pel proxy. Posa pgAdmin en un perfil opcional amb accés local o restringit a la xarxa d’administració.

**Verificació.** Des d’una xarxa d’usuari, comprova que l’aplicació funciona per HTTPS, que HTTP redirigeix i que els ports interns i pgAdmin queden fora del seu abast.

### 2. Limitar la confiança en el proxy i protegir la cookie

Les capçaleres reenviades determinen l’IP efectiva que Laravel utilitza per limitar peticions i l’esquema que ara determina l’atribut `Secure` de la cookie. La confiança depèn de `TRUSTED_PROXIES` i de com els Nginx gestionen aquestes capçaleres.

**Proposta.** Fes que el proxy d’entrada estableixi les capçaleres reenviades a partir de la connexió real. Conserva la cadena entre proxies controlats i limita `TRUSTED_PROXIES` als salts previstos. Configura `Secure` explícitament per a la cookie de sessió en producció, conserva `HttpOnly` i `SameSite=Lax` i permet HTTP només en l’entorn local que ho requereixi.

**Verificació.** Revisa la configuració efectiva de cada salt. Comprova que Laravel rep l’IP i el protocol esperats i que tant l’alta com l’eliminació de la cookie de sessió funcionen per HTTPS.

### 3. Separar els rols de PostgreSQL

L’API i el worker comparteixen les credencials que Compose utilitza per inicialitzar PostgreSQL. L’API també executa migracions durant l’arrencada.

**Proposta.** Crea rols d’execució amb els permisos necessaris sobre taules i seqüències. Reserva els permisos DDL a un rol de migració i executa `app:migrate` en un pas de desplegament previ a l’arrencada normal. Provisiona els rols també a les bases existents, ja que els scripts d’inicialització de PostgreSQL només s’executen amb un volum buit. Limita les credencials d’administració de l’aplicació al procés que crea el compte administrador.

**Verificació.** Comprova en una còpia de prova que les migracions funcionen amb el rol de migració, que els fluxos de l’aplicació i la cua funcionen amb els rols d’execució i que aquests rols tenen denegades les operacions DDL.

## Prioritat mitjana

### 4. Reforçar el login i el reenviament de verificació

El login limita intents per IP. El reenviament substitueix el token anterior i fa l’enviament SMTP dins d’una transacció.

**Proposta.** Afegeix limitadors per IP i per compte amb identificadors de correu normalitzats, inclòs el login d’administració. Per al reenviament, estableix un interval mínim per destinatari i conserva la resposta genèrica. Desa l’estat de la verificació i la feina de correu de manera coherent abans de l’enviament. Fes que el worker apliqui els reintents després de confirmar la transacció i que les feines obsoletes no enviïn enllaços que ja han estat substituïts.

**Verificació.** Amb un transport de prova, comprova els límits, la resposta genèrica, l’expiració i l’ús únic del token, i el comportament durant un error temporal de correu.

### 5. Aïllar el processament de CV

La ruta `POST /api/candidate/cv/extract` processa PDFs aportats pels candidats al contenidor de l’API. Ja hi ha límits de temps, CPU i memòria.

**Proposta.** Trasllada el processament a un procés o contenidor aïllat sense xarxa ni credencials. Dona-li accés de només lectura al PDF concret, executa’l amb un usuari sense privilegis i conserva els límits de recursos. Mantén el control de titularitat a l’API abans de cedir el fitxer al processador.

**Verificació.** Amb PDFs de prova, comprova que els documents vàlids generen suggeriments i que els errors i els temps d’espera es gestionen sense afectar l’API.

## Prioritat baixa

### 6. Evitar canvis d’estat amb GET i HEAD

El detall administratiu d’una empresa i el llistat de candidatures d’una oferta marquen notificacions com a llegides. El middleware de sessió omet el control CSRF per a `GET` i `HEAD`.

**Proposta.** Mou el marcatge a una petició explícita `POST` o `PATCH` amb sessió, rol i CSRF. Limita l’actualització a les notificacions de l’usuari autenticat i al recurs corresponent. Adapta el frontend perquè enviï aquesta petició quan mostri les notificacions.

**Verificació.** Comprova que les lectures deixen les notificacions intactes, que la petició de marcatge exigeix un token CSRF vàlid i que l’operació repetida conserva el mateix resultat.

## Verificació transversal pendent

Executa la matriu amb comptes de prova de candidat, empresa i administració. Comprova els accessos per rol i per titularitat amb dos candidats i dues empreses, especialment per a candidatures i descàrregues de CV. Verifica el rebuig de canvis amb CSRF absent o incorrecte, la revocació de sessions en bloquejar un compte o retirar l’aprovació d’una empresa, i l’accés al desplegament real a través del proxy HTTPS. Aquestes comprovacions complementen les proves anònimes fetes a la instància local.

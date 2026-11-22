import React from 'react';

function Terms() {
  return <article lang="ca">
    <h1>Informació del servei i condicions d’ús</h1>
    <p className="legal-notice">Esborrany pendent de validació institucional.</p>
    <p>Feisea és la borsa de treball gestionada per l’Institut Cirvianum. Permet consultar ofertes, publicar-ne amb un compte d’empresa aprovat i presentar candidatures amb un compte de candidat.</p>
    <p><strong>Titular del servei:</strong> Institut Cirviànum de Torelló (NIF Q5855733A, codi de centre 08058404).<br />
      <strong>Adreça postal:</strong> Carrer Ausiàs March, s/n, 08570 Torelló, Barcelona.<br />
      <strong>Contacte:</strong> <a href="mailto:info@cirvianum.cat">info@cirvianum.cat</a> · <a href="tel:+34938594841">93 859 48 41</a> · <a href="https://agora.xtec.cat/iescirvianum/">Web de l’Institut</a>.</p>
    <p>Poden registrar-se com a candidats [col·lectius admesos i condicions d’edat aprovades]. Les empreses han de verificar el correu i obtenir l’aprovació del centre per accedir al seu espai. Mantén les dades del compte actualitzades i protegeix les credencials.</p>
    <p>Les empreses han de publicar ofertes veraces, lícites i respectuoses amb la igualtat de tracte. Han d’utilitzar les dades rebudes d’acord amb les condicions de l’àrea d’empresa i gestionar-les durant el termini que els sigui aplicable. Per comunicar una oferta sospitosa, incorrecta o discriminatòria, contacta amb <a href="mailto:info@cirvianum.cat">info@cirvianum.cat</a>.</p>
    <p>Presentar una candidatura no garanteix la selecció ni la contractació. Consulta la <a href="/privacitat">informació de privacitat</a> per saber com es tracten les dades personals.</p>
  </article>;
}

function Privacy() {
  return <article lang="ca">
    <h1>Protecció de dades personals</h1>
    <p className="legal-notice">Esborrany pendent de validació institucional.</p>
    <p><strong>Responsable del tractament:</strong> [denominació oficial, adreça i contacte del responsable]. L’Institut Cirviànum de Torelló gestiona el servei de borsa de treball. Pots contactar amb el delegat de protecció de dades a [canal oficial del DPD].</p>
    <p><strong>Finalitats i bases jurídiques.</strong> Utilitzem les dades per gestionar, verificar i protegir els comptes; aprovar l’accés de les empreses; gestionar perfils, ofertes, CV i candidatures; enviar avisos relacionats amb el servei, i atendre consultes i drets. Per a cada finalitat, la base jurídica és [indica la base aprovada i associa-la a cada finalitat. Si és una missió d’interès públic o una obligació legal, identifica la norma que la fonamenta]. Si algun tractament concret es basa en el consentiment, el pots retirar en qualsevol moment sense afectar el tractament anterior a la retirada.</p>
    <p><strong>Dades i procedència.</strong> Recollim la informació que facilites en registrar-te, completar el perfil, publicar una oferta o presentar una candidatura. També tractem les dades generades pel servei, com els estats de les candidatures i [registres tècnics efectius]. Els formularis indiquen els camps obligatoris. Si falten les dades necessàries, no podrem completar el tràmit corresponent. [Si es recullen dades de tercers o altres fonts, descriu-ne les categories, la procedència i com es facilitarà la informació.]</p>
    <p><strong>Destinataris.</strong> Quan presentes una candidatura, l’empresa responsable de l’oferta pot consultar el nom i cognoms, el correu electrònic, el telèfon, el municipi, els estudis, la família professional, les competències, el resum, els enllaços del perfil i el missatge de la candidatura i la còpia del CV adjuntada a la candidatura. L’empresa tracta aquestes dades [paper jurídic aprovat i finalitat]. També poden accedir a les dades [personal autoritzat, categories de prestadors i altres destinataris aplicables]. [Indica si hi ha transferències fora de l’Espai Econòmic Europeu, quines garanties s’apliquen i com se’n pot obtenir una còpia.]</p>
    <p><strong>Conservació.</strong> Conservem les dades de compte i perfil durant [termini o criteri]. Les candidatures i les còpies de CV es conserven durant [termini o criteri]. Els registres de seguretat i les còpies de seguretat segueixen [terminis o criteris aprovats]. Quan correspongui, les dades suprimides es bloquejaran durant el termini legal aplicable.</p>
    <p><strong>Drets.</strong> Pots demanar l’accés, la rectificació, la supressió i la limitació del tractament, oposar-t’hi i demanar la portabilitat quan sigui aplicable. Fes la sol·licitud seguint les <a href="#exercici-de-drets">instruccions per exercir drets</a>. També pots presentar una reclamació davant [autoritat de control competent i enllaç].</p>
    <p><strong>Decisions automatitzades.</strong> [Confirma si hi ha decisions exclusivament automatitzades amb efectes jurídics o similars. Si no n’hi ha, pots publicar: «Feisea no pren decisions exclusivament automatitzades sobre l’accés a una oferta o la selecció de candidats. L’extracció del CV només suggereix camps que pots revisar.» Si n’hi ha, cal explicar-ne la lògica, la importància i les conseqüències previstes.]</p>
    <h2 id="exercici-de-drets">Exercici de drets</h2>
    <p>Per exercir els teus drets sobre les dades de Feisea, utilitza les <a href="https://educacio.gencat.cat/ca/departament/proteccio-dades/drets-persones-interessades/#com-exercir-los">instruccions del Departament d’Educació i Formació Professional</a>. Indica que la petició es refereix a Feisea i, si escau, identifica les candidatures o dades afectades. Segueix les instruccions del tràmit per acreditar la identitat.</p>
    <p>Última actualització: [data].</p>
  </article>;
}

function Cookies() {
  return <article lang="ca">
    <h1>Cookies</h1>
    <p>Feisea utilitza una cookie tècnica pròpia per mantenir la sessió un cop inicies la sessió al servei. Aquesta cookie és necessària per accedir a l’àrea de compte i fer les operacions que hi sol·licites.</p>
    <table>
      <thead><tr><th scope="col">Cookie</th><th scope="col">Finalitat</th><th scope="col">Durada</th></tr></thead>
      <tbody><tr><td><code>feisea_session</code> (nom per defecte)</td><td>Identificar la sessió autenticada.</td><td>720 minuts per defecte o fins que tanquis la sessió. La durada es pot configurar.</td></tr></tbody>
    </table>
    <p>Pots gestionar les cookies des del navegador. Si bloqueges la cookie de sessió, les funcions que requereixen un compte deixaran d’estar disponibles. Per saber com es tracten les dades de sessió, consulta la <a href="/privacitat">informació de privacitat</a>.</p>
  </article>;
}

function Accessibility() {
  return <article lang="ca">
    <h1>Declaració d’accessibilitat</h1>
    <p className="legal-notice">Esborrany pendent de validació institucional.</p>
    <p>[Organisme] es compromet a fer accessible Feisea d’acord amb [normativa aplicable]. Aquesta declaració s’aplica a [URL i abast].</p>
    <p><strong>Situació de compliment:</strong> [plenament conforme, parcialment conforme o no conforme, segons l’avaluació].</p>
    <p><strong>Contingut no accessible:</strong> [llista de deficiències, càrrega desproporcionada o contingut fora d’àmbit quan correspongui, amb justificació i alternatives disponibles].</p>
    <p><strong>Preparació:</strong> declaració preparada el [data] mitjançant [mètode d’avaluació]. Darrera revisió el [data].</p>
    <p><strong>Comunicacions i sol·licituds:</strong> pots comunicar dificultats d’accés o demanar informació en un format accessible a [canal oficial i instruccions].</p>
    <p><strong>Procediment d’aplicació:</strong> si la resposta a una sol·licitud d’informació accessible o queixa és insatisfactòria, segueix [procediment oficial i enllaç].</p>
  </article>;
}

export const legalPages = [
  { path: '/avis-legal', label: 'Avís legal', Page: Terms },
  { path: '/privacitat', label: 'Privacitat', Page: Privacy },
  { path: '/cookies', label: 'Cookies', Page: Cookies },
  { path: '/accessibilitat', label: 'Accessibilitat', Page: Accessibility },
];

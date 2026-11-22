import React from 'react';

export function CompanyDataNotice({ title }) {
  return <p className="legal-notice" lang="ca">Utilitza aquestes dades per gestionar la selecció de {title ? <strong>{title}</strong> : "l’oferta corresponent"}. Limita’n l’accés a les persones autoritzades. Conserva els CV i les dades descarregades durant el termini aplicable i elimina’ls de manera segura quan pertoqui. Qualsevol ús posterior requereix una base jurídica i la informació corresponent a la persona candidata. Per comunicar un accés indegut o una incidència, utilitza el <a href="/avis-legal">contacte del centre</a>.</p>;
}

export function RegistrationNotice({ role }) {
  return <div lang="ca">
    <p className="legal-notice"><strong>Avís de privacitat provisional.</strong>{' '}{role === 'candidate' ? <>
      Feisea tracta les dades per crear i verificar el teu compte i gestionar l’accés a la borsa de treball. En presentar una candidatura, l’empresa de l’oferta podrà consultar les dades indicades a la confirmació i la còpia del CV. Consulta com pots <a href="/privacitat#exercici-de-drets">exercir els teus drets</a>. Consulta la <a href="/privacitat">informació de privacitat</a> i les <a href="/avis-legal">condicions d’ús</a>.
    </> : <>
      Feisea tracta les dades de contacte i del compte per verificar el registre, revisar la sol·licitud d’accés i gestionar les ofertes i candidatures. Consulta com pots <a href="/privacitat#exercici-de-drets">exercir els teus drets</a>. Consulta la <a href="/privacitat">informació de privacitat</a> i les <a href="/avis-legal">condicions d’ús</a>.
    </>}</p>
    {role === 'company' && <details>
      <summary>Condicions per gestionar candidatures i CV</summary>
      <CompanyDataNotice />
    </details>}
  </div>;
}

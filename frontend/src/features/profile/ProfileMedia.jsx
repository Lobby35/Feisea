import React from 'react';
import UploadForm from './UploadForm';
import CvSuggestions from './CvSuggestions';

export default function ProfileMedia({ account, busy, suggestions, onUpload, onRemove, onExtract, onApply }) {
  const candidate = account.user.role === 'candidate';
  return <>
    <h2>{candidate ? 'Profile photo (optional)' : 'Company logo (optional)'}</h2>
    {account.photo_url && <p><img src={`${account.photo_url}?v=${account.photoVersion}`} alt={candidate ? 'Your profile' : 'Company logo'} width="120" /></p>}
    <UploadForm title={candidate ? 'Photo' : 'Logo'} kind="photo" busy={busy} onUpload={onUpload} />
    {account.photo_url && <p><button type="button" disabled={busy} onClick={() => onRemove('photo')}>Remove photo</button></p>}
    {candidate && <>
      <h2>CV</h2>
      {account.cv_url && <p><a href={account.cv_url}>Download CV</a> — {account.profile.cv_original_name}</p>}
      <p className="legal-notice" lang="ca">Inclou al CV només la informació útil per a la selecció. Evita dades de salut, números de documents d’identitat i dades de contacte de tercers que no siguin necessàries. El CV del perfil es desa a l’espai privat. Quan presentes una candidatura, se’n crea una còpia per a l’empresa de l’oferta. <a href="/privacitat">Informació de privacitat</a>.</p>
      <UploadForm title="CV document" kind="cv" busy={busy} onUpload={onUpload} />
      {account.cv_url && <p className="legal-notice" lang="ca">Si demanes extreure dades del CV, Feisea analitzarà el PDF per suggerir camps del perfil. Revisa els suggeriments i decideix quins vols incorporar.</p>}
      {account.cv_url && <p><button type="button" disabled={busy} onClick={onExtract}>Read CV</button>{' '}<button type="button" disabled={busy} onClick={() => onRemove('cv')}>Remove CV</button></p>}
      <CvSuggestions suggestions={suggestions} busy={busy} onApply={onApply} />
    </>}
  </>;
}

import React from 'react';
import UploadForm from './UploadForm';
import CvSuggestions from './CvSuggestions';

export default function ProfileMedia({ account, busy, suggestions, onUpload, onRemove, onExtract, onApply }) {
  const candidate = account.user.role === 'candidate';
  return <>
    <h2>{candidate ? 'Profile photo' : 'Company logo'}</h2>
    {account.photo_url && <p><img src={`${account.photo_url}?v=${account.photoVersion}`} alt={candidate ? 'Your profile' : 'Company logo'} width="120" /></p>}
    <UploadForm title={candidate ? 'Photo' : 'Logo'} kind="photo" busy={busy} onUpload={onUpload} />
    {account.photo_url && <p><button type="button" disabled={busy} onClick={() => onRemove('photo')}>Remove photo</button></p>}
    {candidate && <>
      <h2>CV</h2>
      {account.cv_url && <p><a href={account.cv_url}>Download CV</a> — {account.profile.cv_original_name}</p>}
      <UploadForm title="CV document" kind="cv" busy={busy} onUpload={onUpload} />
      {account.cv_url && <p><button type="button" disabled={busy} onClick={onExtract}>Read CV suggestions</button>{' '}<button type="button" disabled={busy} onClick={() => onRemove('cv')}>Remove CV</button></p>}
      <CvSuggestions suggestions={suggestions} busy={busy} onApply={onApply} />
    </>}
  </>;
}

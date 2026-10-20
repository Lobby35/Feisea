import React from 'react';
export default function UploadForm({ title, kind, busy, onUpload }) {
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (await onUpload(kind, new FormData(form))) form.reset();
  }
  return <form onSubmit={submit}>
    <fieldset disabled={busy}>
      <legend>{title}</legend>
      <p><label>{kind === 'photo' ? 'JPEG, PNG or WebP, up to 2 MB' : 'PDF, up to 10 MB'}<br /><input type="file" name="file" required accept={kind === 'photo' ? 'image/jpeg,image/png,image/webp' : 'application/pdf'} /></label></p>
      <button type="submit">Upload {kind === 'photo' ? 'photo' : 'CV'}</button>
    </fieldset>
  </form>;
}

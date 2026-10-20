import React from 'react';
export default function CvSuggestions({ suggestions, busy, onApply }) {
  if (!suggestions) return null;
  return <section>
    <h3>CV suggestions</h3>
    {Object.keys(suggestions).length ? <dl>{Object.entries(suggestions).map(([key, value]) => <div key={key}><dt>{key.replaceAll('_', ' ')}</dt><dd>{value}</dd></div>)}</dl> : <p>No supported fields were found.</p>}
    <p>Review the suggestions before applying them. Name splits may be inaccurate. Only empty fields are filled, and your account email stays unchanged.</p>
    <button type="button" disabled={busy} onClick={onApply}>Apply suggestions to empty fields</button>
  </section>;
}

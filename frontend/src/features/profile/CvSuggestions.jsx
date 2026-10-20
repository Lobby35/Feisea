import React from 'react';

const labels = { name: 'Name', surname: 'Surname', second_surname: 'Second surname', email: 'Email', phone: 'Phone', linkedin: 'LinkedIn', github: 'GitHub' };

export default function CvSuggestions({ suggestions, busy, onApply }) {
  if (!suggestions) return null;
  return <section>
    <h3>CV suggestions</h3>
    {Object.keys(suggestions).length ? <dl>{Object.entries(suggestions).map(([key, value]) => <div key={key}><dt>{labels[key] ?? key}</dt><dd>{value}</dd></div>)}</dl> : <p>No details found.</p>}
    <button type="button" disabled={busy} onClick={onApply}>Apply suggestions</button>
  </section>;
}

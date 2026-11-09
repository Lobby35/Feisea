import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import Notice from '../../components/Notice';
import Pagination from '../../components/Pagination';
import { statuses } from '../../features/offers/fields';

export default function ApplicantsPage({ id }) {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.applicants(id, page).then(setData).catch(error => setMessage(error.message)); }, [id, page]);
  async function update(application, status) {
    setBusy(true); setMessage('');
    try { await api.applicationStatus(application, status); setData(await api.applicants(id, page)); }
    catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  return <><h1>Applicants{data ? `: ${data.offer.title}` : ''}</h1><Notice>{message}</Notice>
    {data?.applications.data.length === 0 && <p>No applications yet.</p>}
    {data?.applications.data.map(application => {
      const { candidate } = application;
      const user = candidate.user;
      return <section key={application.id}>
        <h2>{[user.name, user.surname, user.second_surname].filter(Boolean).join(' ')}</h2>
        <p>{user.email} · {candidate.phone} · {candidate.city}</p>
        <p>{candidate.current_studies} · {candidate.study_family}</p>
        <p>{candidate.skills.map(skill => skill.name).join(', ')}</p>
        {candidate.summary && <p className="multiline">{candidate.summary}</p>}
        {['linkedin', 'github', 'portfolio'].map(name => candidate[name] && <p key={name}><a href={candidate[name]} target="_blank" rel="noreferrer">{name}</a></p>)}
        {application.message && <p className="multiline">{application.message}</p>}
        <p><a href={`/api/company/applications/${application.id}/cv`}>Download CV</a></p>
        <p><label>Status{' '}<select aria-label={`Status for ${user.name}`} value={application.status} disabled={busy || application.status === 'withdrawn'} onChange={event => update(application.id, event.target.value)}>{[...statuses, 'withdrawn'].map(status => <option key={status} value={status} disabled={status === 'withdrawn'}>{status}</option>)}</select></label></p>
        <details><summary>Status history</summary><ul>{application.history.map(item => <li key={item.id}>{item.new_status} · {new Date(item.changed_at).toLocaleString()}</li>)}</ul></details>
      </section>;
    })}
    <Pagination data={data?.applications} onPage={setPage} />
    <p><a href="/company/dashboard">Back to dashboard</a></p>
  </>;
}

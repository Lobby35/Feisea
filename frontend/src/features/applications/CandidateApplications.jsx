import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import Notice from '../../components/Notice';
import Pagination from '../../components/Pagination';

export default function CandidateApplications() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.applications(page).then(setData).catch(error => setMessage(error.message)); }, [page]);
  async function withdraw(id) {
    if (!window.confirm('Withdraw this application?')) return;
    setBusy(true); setMessage('');
    try { await api.withdraw(id); setData(await api.applications(page)); }
    catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  return <section><h2>Your applications</h2><Notice>{message}</Notice>
    {data?.data.length === 0 && <p>No applications yet.</p>}
    {data?.data.map(application => <section key={application.id}>
      <h3>{application.offer.title}</h3><p>{application.offer.company.name}</p><p>Status: {application.status}</p>
      <p>Applied: {new Date(application.created_at).toLocaleDateString()}</p>
      {application.message && <p>{application.message}</p>}
      <details><summary>Status history</summary><ul>{application.history.map(item => <li key={item.id}>{item.new_status} · {new Date(item.changed_at).toLocaleString()}</li>)}</ul></details>
      {['pending', 'reviewed', 'interview'].includes(application.status) && <p><button disabled={busy} onClick={() => withdraw(application.id)}>Withdraw</button></p>}
    </section>)}
    <Pagination data={data} onPage={setPage} />
  </section>;
}

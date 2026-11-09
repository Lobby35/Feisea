import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import Notice from '../../components/Notice';
import Pagination from '../../components/Pagination';

export default function CompanyOffers() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api.companyOffers(page).then(setData).catch(error => setMessage(error.message));
    api.notifications().then(setNotifications).catch(error => setMessage(error.message));
  }, [page]);
  async function remove(id) {
    if (!window.confirm('Delete this offer and its applications?')) return;
    setBusy(true); setMessage('');
    try { await api.deleteOffer(id); setData(await api.companyOffers(page)); setNotifications(await api.notifications()); }
    catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  return <section><h2>Your offers</h2><Notice>{message}</Notice>
    <p><a href="/company/offers/new">Create offer</a></p>
    {notifications.length > 0 && <section><h3>New applications</h3><ul>{notifications.map(item => <li key={item.id}><a href={`/company/offers/${item.job_offer_id}/applications`}>{item.data.title ?? JSON.parse(item.data).title}</a></li>)}</ul></section>}
    {data?.data.length === 0 && <p>No offers yet.</p>}
    {data?.data.map(offer => <section key={offer.id}><h3>{offer.title}</h3><p>{offer.status} · {offer.applications_count} applications</p>
      <p><a href={`/company/offers/${offer.id}/edit`}>Edit</a>{' · '}<a href={`/company/offers/${offer.id}/applications`}>View applicants</a></p>
      <button disabled={busy} onClick={() => remove(offer.id)}>Delete</button>
    </section>)}
    <Pagination data={data} onPage={setPage} />
  </section>;
}

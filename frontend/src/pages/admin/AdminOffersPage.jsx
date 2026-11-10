import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import AdminNav from '../../components/AdminNav';
import Notice from '../../components/Notice';
import Pagination from '../../components/Pagination';

export default function AdminOffersPage() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState({ page: 1 });
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.adminOffers(query).then(setData).catch(error => setMessage(error.message)); }, [query]);
  async function change(id, remove) {
    if (!window.confirm(remove ? 'Delete this offer and its applications?' : 'Close this offer?')) return;
    setBusy(true); setMessage('');
    try {
      if (remove) await api.adminDeleteOffer(id);
      else await api.adminCloseOffer(id);
      setData(await api.adminOffers(query));
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  return <><h1>Offers</h1><AdminNav /><Notice>{message}</Notice>
    <form onSubmit={event => { event.preventDefault(); setQuery({ search, page: 1 }); }}><p><label>Search<input value={search} onChange={event => setSearch(event.target.value)} /></label></p><button type="submit">Search</button></form>
    {data?.data.length === 0 && <p>No offers found.</p>}
    {data?.data.map(offer => <section key={offer.id}><h2>{offer.title}</h2><p>{offer.company.name} · {offer.status} · {offer.applications_count} applications</p><p className="multiline">{offer.description}</p>
      <p><button disabled={busy || offer.status === 'closed'} onClick={() => change(offer.id, false)}>Close</button>{' '}<button disabled={busy} onClick={() => change(offer.id, true)}>Delete</button></p>
    </section>)}
    <Pagination data={data} onPage={page => setQuery(old => ({ ...old, page }))} />
  </>;
}

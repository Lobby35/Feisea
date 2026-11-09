import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import Notice from '../../components/Notice';
import useOptions from '../../hooks/useOptions';
import OfferForm from '../../features/offers/OfferForm';
import { offerDraft } from '../../features/offers/fields';

export default function OfferEditPage({ id }) {
  const { options, error } = useOptions();
  const [draft, setDraft] = useState(id ? null : offerDraft());
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (id) api.companyOffer(id).then(offer => setDraft(offerDraft(offer))).catch(error => setMessage(error.message));
  }, [id]);
  const change = name => value => setDraft(old => ({ ...old, [name]: value }));
  async function save(event) {
    event.preventDefault();
    setBusy(true); setMessage('');
    const body = {};
    for (const [name, value] of Object.entries(draft)) body[name] = value === '' ? null : value;
    try { await api.saveOffer(id, body); window.location.assign('/company/dashboard'); }
    catch (error) { setMessage(error.message); setBusy(false); }
  }
  return <><h1>{id ? 'Edit offer' : 'New offer'}</h1><Notice>{error || message}</Notice>
    {options && draft ? <OfferForm draft={draft} change={change} options={options} busy={busy} onSubmit={save} /> : <p>Loading…</p>}
    <a href="/company/dashboard">Back to dashboard</a>
  </>;
}

import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import { useAccount } from '../../context/AccountContext';
import Notice from '../../components/Notice';
import useOptions from '../../hooks/useOptions';
import { longFields } from '../../features/offers/fields';

export default function OfferPage({ id }) {
  const { account } = useAccount();
  const { options } = useOptions();
  const [offer, setOffer] = useState(null);
  const [message, setMessage] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [applied, setApplied] = useState(false);
  useEffect(() => { api.offer(id).then(setOffer).catch(error => setMessage(error.message)); }, [id]);
  async function apply(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    try { await api.apply(id, note); setApplied(true); setMessage('Application sent.'); }
    catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  return <><Notice>{message}</Notice>{offer && <>
    <h1>{offer.title}</h1><h2>{offer.company.name}</h2>
    <p>{offer.location} · {offer.modality} · {offer.offer_type}</p>
    {longFields.map(([name, label]) => offer[name] && <section key={name}><h2>{label}</h2><p className="multiline">{offer[name]}</p></section>)}
    <dl>
      {['category_id', 'minimum_qualification_id'].map((name, index) => <React.Fragment key={name}><dt>{index === 0 ? 'Professional field' : 'Minimum studies'}</dt><dd>{options?.[index === 0 ? 'categories' : 'qualifications'].find(item => Number(item.id) === Number(offer[name]))?.name || '—'}</dd></React.Fragment>)}
      {['minimum_experience_years', 'contract_type', 'schedule', 'working_hours', 'hours_per_week', 'duration_months', 'address', 'start_date'].map(name => offer[name] != null && <React.Fragment key={name}><dt>{name.replaceAll('_', ' ')}</dt><dd>{offer[name]}</dd></React.Fragment>)}
      <dt>Salary (EUR / {offer.salary_period})</dt><dd>{offer.salary_min ?? '—'} – {offer.salary_max ?? '—'}</dd>
      <dt>Immediate start</dt><dd>{offer.immediate_start ? 'Yes' : 'No'}</dd>
      <dt>Published</dt><dd>{new Date(offer.published_at).toLocaleDateString()}</dd>
      <dt>Deadline</dt><dd>{offer.expires_at ? new Date(offer.expires_at).toLocaleDateString() : 'Open'}</dd>
      <dt>Competencies</dt><dd>{offer.skills.map(skill => skill.name).join(', ') || '—'}</dd>
      <dt>Languages</dt><dd>{offer.languages.map(language => `${language.name} ${language.pivot.required_level}`).join(', ') || '—'}</dd>
    </dl>
    {account?.user.role === 'candidate' && !applied && <form onSubmit={apply}><p><label>Message<textarea name="message" value={note} maxLength={5000} onChange={event => setNote(event.target.value)} rows={4} /></label></p><button disabled={busy}>Apply</button></form>}
    {applied && <p><a href="/candidate/dashboard">View your applications</a></p>}
    {!account && <p><a href="/candidate/login">Log in to apply</a></p>}
  </>}<p><a href="/offers">All offers</a></p></>;
}

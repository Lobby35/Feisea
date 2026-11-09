import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import Notice from '../../components/Notice';
import Pagination from '../../components/Pagination';
import SelectField from '../../components/SelectField';
import TownField from '../../components/TownField';
import useOptions from '../../hooks/useOptions';
import { offerChoices } from '../../features/offers/fields';

export default function OffersPage() {
  const { options, error } = useOptions();
  const [filters, setFilters] = useState({ search: '', location: '', category_id: '', modality: '', offer_type: '', contract_type: '' });
  const [query, setQuery] = useState({ page: 1 });
  const [offers, setOffers] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true); setMessage('');
    api.offers(query).then(data => { if (active) setOffers(data); }).catch(error => { if (active) setMessage(error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [query]);
  const change = name => value => setFilters(old => ({ ...old, [name]: value }));
  function search(event) {
    event.preventDefault();
    setQuery({ ...filters, page: 1 });
  }
  return <><h1>Job offers</h1><Notice>{error || message}</Notice>
    {options && <form onSubmit={search}><fieldset><legend>Search offers</legend>
      <p><label>Search<input name="search" value={filters.search} onChange={event => change('search')(event.target.value)} /></label></p>
      <TownField towns={options.municipalities} value={filters.location} onChange={change('location')} />
      <SelectField name="category_id" label="Professional field" value={filters.category_id} options={options.categories} onChange={change('category_id')} />
      {['modality', 'offer_type', 'contract_type'].map(name => <SelectField key={name} name={name} label={name.replaceAll('_', ' ')} value={filters[name]} options={offerChoices[name].map(([id, name]) => ({ id, name }))} onChange={change(name)} />)}
      <button type="submit">Search</button>
    </fieldset></form>}
    {loading ? <p>Loading…</p> : offers && <>
      {offers.data.length === 0 && <p>No offers found.</p>}
      {offers.data.map(offer => <section key={offer.id}><h2><a href={`/offers/${offer.id}`}>{offer.title}</a></h2><p>{offer.company.name} · {offer.location} · {offer.modality} · {offer.contract_type}</p><p>{new Date(offer.published_at).toLocaleDateString()}</p></section>)}
      <Pagination data={offers} onPage={page => setQuery(old => ({ ...old, page }))} />
    </>}
  </>;
}

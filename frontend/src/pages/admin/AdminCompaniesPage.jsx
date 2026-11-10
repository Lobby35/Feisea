import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import AdminNav from '../../components/AdminNav';
import Notice from '../../components/Notice';
import Pagination from '../../components/Pagination';

export default function AdminCompaniesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('pending');
  const [query, setQuery] = useState({ status: 'pending', page: 1 });
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');
  useEffect(() => { setMessage(''); api.adminCompanies(query).then(setData).catch(error => setMessage(error.message)); }, [query]);
  function filter(event) { event.preventDefault(); setQuery({ search, status, page: 1 }); }
  return <><h1>Companies</h1><AdminNav /><Notice>{message}</Notice>
    <form onSubmit={filter}><p><label>Search<input name="search" value={search} onChange={event => setSearch(event.target.value)} /></label></p>
      <p><label>Status<select name="status" value={status} onChange={event => setStatus(event.target.value)}><option value="">All</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="blocked">Blocked</option></select></label></p><button type="submit">Search</button>
    </form>
    {data?.data.length === 0 && <p>No companies found.</p>}
    {data?.data.map(company => <section key={company.id}><h2><a href={`/admin/companies/${company.id}`}>{company.name}</a></h2><p>{company.user.email}</p><p>Status: {company.status} · Email verified: {company.user.email_verified_at ? 'Yes' : 'No'}</p></section>)}
    <Pagination data={data} onPage={page => setQuery(old => ({ ...old, page }))} />
  </>;
}

import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import { useAccount } from '../../context/AccountContext';
import AdminNav from '../../components/AdminNav';
import Notice from '../../components/Notice';
import Pagination from '../../components/Pagination';

export default function AdminUsersPage() {
  const { account } = useAccount();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [query, setQuery] = useState({ page: 1 });
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.adminUsers(query).then(setData).catch(error => setMessage(error.message)); }, [query]);
  async function change(user, remove) {
    if (remove && !window.confirm('Delete this account and its data?')) return;
    const status = user.status === 'blocked' ? 'active' : 'blocked';
    if (!remove && !window.confirm(`${status === 'blocked' ? 'Block' : 'Activate'} this account?`)) return;
    setBusy(true); setMessage('');
    try {
      if (remove) await api.deleteUser(user.id);
      else await api.userStatus(user.id, status);
      setData(await api.adminUsers(query));
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  return <><h1>Users</h1><AdminNav /><Notice>{message}</Notice>
    <form onSubmit={event => { event.preventDefault(); setQuery({ search, role, page: 1 }); }}>
      <p><label>Search<input value={search} onChange={event => setSearch(event.target.value)} /></label></p>
      <p><label>Role<select value={role} onChange={event => setRole(event.target.value)}><option value="">All</option><option value="candidate">Candidate</option><option value="company">Company</option><option value="admin">Administrator</option></select></label></p>
      <button type="submit">Search</button>
    </form>
    {data?.data.length === 0 && <p>No accounts found.</p>}
    {data?.data.map(user => <section key={user.id}><h2>{[user.name, user.surname, user.second_surname].filter(Boolean).join(' ')}</h2><p>{user.email} · {user.role} · {user.status}</p><p>Email verified: {user.email_verified_at ? 'Yes' : 'No'}</p>
      {String(user.id) !== String(account.user.id) && <p><button disabled={busy} onClick={() => change(user, false)}>{user.status === 'blocked' ? 'Activate' : 'Block'}</button>{' '}<button disabled={busy} onClick={() => change(user, true)}>Delete</button></p>}
    </section>)}
    <Pagination data={data} onPage={page => setQuery(old => ({ ...old, page }))} />
  </>;
}

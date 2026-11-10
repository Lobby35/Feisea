import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import AdminNav from '../../components/AdminNav';
import Notice from '../../components/Notice';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');
  useEffect(() => { api.adminSummary().then(setData).catch(error => setMessage(error.message)); }, []);
  return <><h1>Administration</h1><AdminNav /><Notice>{message}</Notice>
    {data && <>
      <dl><dt>Users</dt><dd>{data.users}</dd><dt>Companies awaiting approval</dt><dd><a href="/admin/companies">{data.pending_companies}</a></dd><dt>Companies</dt><dd>{data.companies}</dd><dt>Offers</dt><dd>{data.offers}</dd><dt>Applications</dt><dd>{data.applications}</dd></dl>
      <h2>New company registrations</h2>
      {data.notifications.length === 0 ? <p>No new notifications.</p> : <ul>{data.notifications.map(item => <li key={item.id}><a href={`/admin/companies/${item.company_id}`}>{item.data.name}</a> · {item.data.email}</li>)}</ul>}
    </>}
  </>;
}

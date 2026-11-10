import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import AdminNav from '../../components/AdminNav';
import Notice from '../../components/Notice';

export default function AdminCompanyPage({ id }) {
  const [company, setCompany] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.adminCompany(id).then(setCompany).catch(error => setMessage(error.message)); }, [id]);
  async function review(status) {
    const action = status === 'approved' ? 'Approve' : status === 'blocked' ? 'Reject or block' : 'Return to pending';
    if (!window.confirm(`${action} this company?`)) return;
    setBusy(true); setMessage('');
    try { setCompany(await api.reviewCompany(id, status)); setMessage('Company updated.'); }
    catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  return <><h1>{company?.name ?? 'Company review'}</h1><AdminNav /><Notice>{message}</Notice>
    {company && <>
      <dl><dt>Email</dt><dd>{company.user.email}</dd><dt>Email verified</dt><dd>{company.user.email_verified_at ? 'Yes' : 'No'}</dd><dt>Account status</dt><dd>{company.user.status}</dd><dt>Company status</dt><dd>{company.status}</dd>
        {['cif', 'phone', 'city', 'address', 'contact_email'].map(name => company[name] && <React.Fragment key={name}><dt>{name.replaceAll('_', ' ')}</dt><dd>{company[name]}</dd></React.Fragment>)}
        {company.website && <><dt>Website</dt><dd><a href={company.website} target="_blank" rel="noreferrer">{company.website}</a></dd></>}
        <dt>Registered</dt><dd>{new Date(company.created_at).toLocaleString()}</dd><dt>Offers</dt><dd>{company.offers_count}</dd>
        {company.reviewed_at && <><dt>Last reviewed</dt><dd>{new Date(company.reviewed_at).toLocaleString()}</dd></>}
      </dl>
      {company.description && <p className="multiline">{company.description}</p>}
      <p><button disabled={busy || company.status === 'approved'} onClick={() => review('approved')}>Approve</button>{' '}<button disabled={busy || company.status === 'blocked'} onClick={() => review('blocked')}>Reject / block</button>{' '}<button disabled={busy || company.status === 'pending'} onClick={() => review('pending')}>Return to pending</button></p>
    </>}
  </>;
}

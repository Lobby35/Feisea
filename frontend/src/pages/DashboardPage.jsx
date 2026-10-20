import React from 'react';
import { useAccount } from '../context/AccountContext';

export default function DashboardPage() {
  const { account } = useAccount();
  const { user, profile } = account;
  const name = [user.name, user.surname, user.second_surname].filter(Boolean).join(' ');
  return <>
    <h1>{user.role === 'candidate' ? 'Candidate' : 'Company'} dashboard</h1>
    <p>Welcome, {name}.</p>
    <p>{user.email} — Email verified.</p>
    {user.role === 'company' && <p>Company profile status: {profile.status}. Email verification does not replace company approval.</p>}
    <p><a href={`/${user.role}/profile`}>Edit your profile</a></p>
  </>;
}

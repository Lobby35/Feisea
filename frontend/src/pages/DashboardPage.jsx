import React from 'react';
import { useAccount } from '../context/AccountContext';

export default function DashboardPage() {
  const { account } = useAccount();
  const { user, profile } = account;
  const name = user.role === 'company' ? profile.name : [user.name, user.surname, user.second_surname].filter(Boolean).join(' ');
  return <>
    <h1>{user.role === 'candidate' ? 'Candidate' : 'Company'} dashboard</h1>
    <p>Welcome, {name}.</p>
    <p>{user.email}</p>
    {user.role === 'company' && <p>Company profile status: {profile.status}.</p>}
    <p><a href={`/${user.role}/profile`}>Edit your profile</a></p>
  </>;
}

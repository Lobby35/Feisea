import React from 'react';
import { useEffect } from 'react';
import { useAccount } from '../context/AccountContext';
import Notice from './Notice';

export default function AccountGuard({ role, setup, children }) {
  const { account, loading, error } = useAccount();
  let redirect = null;
  if (!loading && !error) {
    if (!account) redirect = `/${role}/login`;
    else if (account.user.role !== role) redirect = `/${account.user.role}/dashboard`;
    else if (!account.user.onboarding_completed_at && !setup) redirect = `/${role}/setup`;
    else if (account.user.onboarding_completed_at && setup) redirect = `/${role}/dashboard`;
  }
  useEffect(() => { if (redirect) window.location.replace(redirect); }, [redirect]);
  if (loading || redirect) return <Notice>Loading…</Notice>;
  if (error) return <Notice>{error}</Notice>;
  return children;
}

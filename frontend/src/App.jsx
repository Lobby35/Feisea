import React from 'react';
import { AccountProvider } from './context/AccountContext';
import AccountGuard from './components/AccountGuard';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import AccountPage from './pages/auth/AccountPage';
import VerifyPage from './pages/auth/VerifyPage';
import VerificationRequestPage from './pages/auth/VerificationRequestPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const match = path.match(/^\/(candidate|company)\/(register|login|verification|dashboard|profile|setup)$/);
  let page;
  if (path === '/') page = <HomePage />;
  else if (path === '/verify-email') page = <VerifyPage />;
  else if (match) {
    const [, role, action] = match;
    if (action === 'verification') page = <VerificationRequestPage role={role} />;
    else if (['register', 'login'].includes(action)) page = <AccountPage role={role} register={action === 'register'} />;
    else page = <AccountGuard role={role} setup={action === 'setup'}>{action === 'dashboard' ? <DashboardPage /> : <ProfilePage setup={action === 'setup'} />}</AccountGuard>;
  } else page = <><h1>Page not found</h1><a href="/">Return home</a></>;
  return <AccountProvider><Header /><main>{page}</main></AccountProvider>;
}

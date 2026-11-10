import React from 'react';

export default function AdminNav() {
  return <p><a href="/admin/dashboard">Overview</a>{' · '}<a href="/admin/companies">Companies</a>{' · '}<a href="/admin/users">Users</a>{' · '}<a href="/admin/offers">Offers</a></p>;
}

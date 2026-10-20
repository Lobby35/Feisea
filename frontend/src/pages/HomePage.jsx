import React from 'react';

export default function HomePage() {
  return <><h1>Feisea</h1>
    <section><h2>Candidates</h2><p><a href="/candidate/register">Register</a>{' · '}<a href="/candidate/login">Log in</a></p></section>
    <section><h2>Companies</h2><p><a href="/company/register">Register</a>{' · '}<a href="/company/login">Log in</a></p></section>
  </>;
}

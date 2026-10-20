import React from 'react';
export default function HomePage() {
  return <><h1>Feisea</h1><p>A job board for candidates and companies.</p>
    <section><h2>Candidates</h2><p>Create a profile and upload your CV.</p><p><a href="/candidate/register">Register as a candidate</a>{' · '}<a href="/candidate/login">Candidate login</a></p></section>
    <section><h2>Companies</h2><p>Create a company profile.</p><p><a href="/company/register">Register a company</a>{' · '}<a href="/company/login">Company login</a></p></section>
  </>;
}

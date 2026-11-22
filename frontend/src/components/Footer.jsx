import React from 'react';
import { legalPages } from '../pages/LegalPages';

export default function Footer() {
  return <footer className="site-footer" lang="ca">
    <p>Feisea · Institut Cirviànum de Torelló</p>
    <nav aria-label="Informació legal">
      {legalPages.map(({ path, label }) => <a key={path} href={path}>{label}</a>)}
    </nav>
  </footer>;
}

import React from 'react';
export default function Notice({ children }) {
  return children ? <p role="status" aria-live="polite">{children}</p> : null;
}

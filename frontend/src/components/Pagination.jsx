import React from 'react';

export default function Pagination({ data, onPage }) {
  if (!data || data.last_page <= 1) return null;
  return <p>
    <button disabled={data.current_page <= 1} onClick={() => onPage(data.current_page - 1)}>Previous</button>
    {' '}{data.current_page} / {data.last_page}{' '}
    <button disabled={data.current_page >= data.last_page} onClick={() => onPage(data.current_page + 1)}>Next</button>
  </p>;
}

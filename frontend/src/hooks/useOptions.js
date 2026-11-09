import { useEffect, useState } from 'react';
import { api } from '../api';

let optionsRequest;

export default function useOptions() {
  const [options, setOptions] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    if (!optionsRequest) optionsRequest = api.options();
    optionsRequest.then(data => { if (active) setOptions(data); }).catch(error => {
      optionsRequest = null;
      if (active) setError(error.message);
    });
    return () => { active = false; };
  }, []);
  return { options, error };
}

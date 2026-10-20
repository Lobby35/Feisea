import { useState } from 'react';
import { api } from '../../api';
import { useAccount } from '../../context/AccountContext';
import { profileDraft } from './fields';

export default function useProfileEditor() {
  const { account, updateAccount } = useAccount();
  const role = account.user.role;
  const [draft, setDraft] = useState(() => profileDraft(account));
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const change = name => value => setDraft(old => ({ ...old, [name]: value }));
  async function run(action, success) {
    setBusy(true); setMessage('');
    try {
      const result = await action();
      if (result?.profile) updateAccount(result);
      setMessage(success);
      return result;
    } catch (error) { setMessage(error.message); return null; }
    finally { setBusy(false); }
  }
  async function save(event) {
    event.preventDefault();
    const complete = event.nativeEvent.submitter?.value === 'complete';
    await run(async () => {
      const result = await api.save(role, draft);
      if (complete) {
        const finished = await api.completeSetup(role);
        window.location.assign(`/${role}/dashboard`);
        return finished;
      }
      return result;
    }, 'Profile saved.');
  }
  async function upload(kind, body) {
    const result = await run(() => api.upload(role, kind, body), kind === 'photo' ? 'Photo uploaded.' : 'CV uploaded.');
    if (result && kind === 'cv') setSuggestions(null);
    return result;
  }
  async function remove(kind) {
    const result = await run(() => api.remove(role, kind), kind === 'photo' ? 'Photo removed.' : 'CV removed.');
    if (result && kind === 'cv') setSuggestions(null);
  }
  async function extract() {
    const result = await run(api.extract, 'Suggestions are ready. Review them before applying.');
    if (result) setSuggestions(result.suggestions);
  }
  function apply() {
    setDraft(old => {
      const next = { ...old };
      for (const key of ['name', 'surname', 'second_surname', 'phone', 'linkedin', 'github']) if (!next[key] && suggestions[key]) next[key] = suggestions[key];
      return next;
    });
    setMessage('Suggestions added to the form. Check them and save your profile.');
  }
  return { account, draft, message, busy, suggestions, change, save, upload, remove, extract, apply };
}

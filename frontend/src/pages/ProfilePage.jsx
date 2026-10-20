import React from 'react';
import Notice from '../components/Notice';
import ProfileForm from '../features/profile/ProfileForm';
import ProfileMedia from '../features/profile/ProfileMedia';
import useProfileEditor from '../features/profile/useProfileEditor';

export default function ProfilePage({ setup }) {
  const editor = useProfileEditor();
  const candidate = editor.account.user.role === 'candidate';
  return <>
    <h1>{setup ? 'Complete your profile' : candidate ? 'Candidate profile' : 'Company profile'}</h1>
    <Notice>{editor.message}</Notice>
    <ProfileForm candidate={candidate} draft={editor.draft} change={editor.change} busy={editor.busy} onSubmit={editor.save} />
    <ProfileMedia account={editor.account} busy={editor.busy} suggestions={editor.suggestions} onUpload={editor.upload} onRemove={editor.remove} onExtract={editor.extract} onApply={editor.apply} />
    {setup && <p><button type="submit" form="profile-details" value="complete" disabled={editor.busy}>Finish setup</button></p>}
    {!setup && <p><a href={`/${editor.account.user.role}/dashboard`}>Back to dashboard</a></p>}
  </>;
}

export const candidateFields = [['phone', 'Phone'], ['city', 'City'], ['current_studies', 'Current studies'], ['availability', 'Availability'], ['linkedin', 'LinkedIn'], ['github', 'GitHub'], ['portfolio', 'Portfolio']];
export const companyFields = [['company_name', 'Company name'], ['phone', 'Phone'], ['city', 'City'], ['address', 'Address'], ['website', 'Website'], ['contact_email', 'Contact email']];
export const fieldType = name => name === 'contact_email' ? 'email' : ['website', 'linkedin', 'github', 'portfolio'].includes(name) ? 'url' : 'text';

export function profileDraft(account) {
  const candidate = account.user.role === 'candidate';
  const draft = {};
  for (const key of candidate ? ['name', 'surname', 'second_surname'] : []) draft[key] = account.user[key] ?? '';
  for (const [key] of candidate ? candidateFields : companyFields) draft[key] = key === 'company_name' ? account.profile.name : account.profile[key] ?? '';
  draft[candidate ? 'summary' : 'description'] = account.profile[candidate ? 'summary' : 'description'] ?? '';
  if (candidate) {
    draft.mobility = account.profile.mobility ?? false;
    draft.preferred_modality = account.profile.preferred_modality ?? '';
    draft.preferred_schedule = account.profile.preferred_schedule ?? '';
  }
  return draft;
}

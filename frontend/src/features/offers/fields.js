export const offerChoices = {
  offer_type: [['job', 'Job'], ['internship', 'Internship'], ['collaboration', 'Collaboration']],
  modality: [['onsite', 'On site'], ['hybrid', 'Hybrid'], ['remote', 'Remote']],
  contract_type: [['permanent', 'Permanent'], ['temporary', 'Temporary'], ['internship', 'Internship'], ['freelance', 'Freelance'], ['training', 'Training'], ['other', 'Other']],
  schedule: [['full_time', 'Full time'], ['part_time', 'Part time'], ['flexible', 'Flexible']],
  salary_period: [['year', 'Year'], ['month', 'Month'], ['hour', 'Hour']],
  status: [['draft', 'Draft'], ['published', 'Published'], ['closed', 'Closed']],
};
export const textFields = [['title', 'Title'], ['address', 'Address'], ['working_hours', 'Working hours']];
export const longFields = [['description', 'Description'], ['responsibilities', 'Responsibilities'], ['requirements', 'Requirements'], ['mandatory_requirements', 'Essential requirements'], ['desirable_requirements', 'Desirable requirements']];
export const numberFields = [['minimum_experience_years', 'Minimum experience (years)'], ['hours_per_week', 'Hours per week'], ['duration_months', 'Duration (months)'], ['salary_min', 'Minimum salary (EUR)'], ['salary_max', 'Maximum salary (EUR)']];
export const statuses = ['pending', 'reviewed', 'interview', 'accepted', 'rejected'];

export function offerDraft(offer) {
  const draft = { title: '', description: '', location: '', category_id: '', minimum_qualification_id: '', offer_type: 'job', modality: 'onsite', contract_type: 'permanent', schedule: 'full_time', salary_period: 'year', status: 'published', immediate_start: false, start_date: '', expires_at: '', skill_ids: [], languages: [] };
  for (const [name] of [...textFields, ...longFields, ...numberFields]) draft[name] = '';
  if (offer) {
    for (const name of Object.keys(draft)) draft[name] = offer[name] ?? draft[name];
    draft.start_date = (offer.start_date ?? '').slice(0, 10);
    draft.expires_at = (offer.expires_at ?? '').slice(0, 10);
    draft.skill_ids = offer.skills.map(skill => Number(skill.id));
    draft.languages = offer.languages.map(language => ({ id: Number(language.id), level: language.pivot.required_level }));
  }
  return draft;
}

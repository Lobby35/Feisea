import React from 'react';
import TownField from '../../components/TownField';
import SelectField from '../../components/SelectField';
import Field from '../../components/Field';
import NameFields from '../../components/NameFields';
import { candidateFields, companyFields, fieldType } from './fields';

export default function ProfileForm({ candidate, draft, change, busy, onSubmit, options }) {
  const description = candidate ? 'summary' : 'description';
  const studyLevels = Object.keys(options.studies);
  if (candidate && draft.current_studies && !studyLevels.includes(draft.current_studies)) {
    studyLevels.push(draft.current_studies);
  }
  return <form id="profile-details" onSubmit={onSubmit}>
    <fieldset disabled={busy}>
      <legend>{candidate ? 'Your details' : 'Company details'}</legend>
      {candidate && <NameFields values={draft} onChange={change} />}
      {(candidate ? candidateFields : companyFields).filter(([name]) => !['city', 'current_studies'].includes(name)).map(([name, label]) => <Field key={name} label={label} name={name} value={draft[name]} onChange={change(name)} required={name === 'company_name'} type={fieldType(name)} />)}
      <TownField towns={options.municipalities} value={draft.city} onChange={change('city')} />
      {candidate && <>
        <SelectField name="current_studies" label="Studies" value={draft.current_studies} options={studyLevels.map(name => ({ id: name, name }))} onChange={value => { change('current_studies')(value); change('study_family')(''); }} />
        <SelectField name="study_family" label="Study family" value={draft.study_family} options={(options.studies[draft.current_studies] ?? []).map(name => ({ id: name, name }))} onChange={change('study_family')} />
        <SelectField name="skill_ids" label="Competencies" value={draft.skill_ids} options={options.skills} onChange={change('skill_ids')} multiple />
      </>}
      <p><label>{candidate ? 'About you' : 'Company description'}<br /><textarea name={description} rows={5} cols={50} maxLength={10000} value={draft[description]} onChange={event => change(description)(event.target.value)} /></label></p>
      {candidate && <>
        <p><label><input type="checkbox" name="mobility" checked={draft.mobility} onChange={event => change('mobility')(event.target.checked)} /> Willing to travel or relocate</label></p>
        <p><label htmlFor="preferred_modality">Preferred work arrangement</label><br /><select id="preferred_modality" name="preferred_modality" value={draft.preferred_modality} onChange={event => change('preferred_modality')(event.target.value)}><option value="">No preference</option><option value="onsite">On site</option><option value="hybrid">Hybrid</option><option value="remote">Remote</option></select></p>
        <p><label htmlFor="preferred_schedule">Preferred schedule</label><br /><select id="preferred_schedule" name="preferred_schedule" value={draft.preferred_schedule} onChange={event => change('preferred_schedule')(event.target.value)}><option value="">No preference</option><option value="full_time">Full time</option><option value="part_time">Part time</option><option value="flexible">Flexible</option></select></p>
      </>}
      <button type="submit" value="save">Save profile</button>
    </fieldset>
  </form>;
}

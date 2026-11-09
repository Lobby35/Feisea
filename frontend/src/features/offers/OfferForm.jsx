import React from 'react';
import Field from '../../components/Field';
import TownField from '../../components/TownField';
import SelectField from '../../components/SelectField';
import { offerChoices, textFields, longFields, numberFields } from './fields';

export default function OfferForm({ draft, change, options, busy, onSubmit }) {
  function changeLanguage(id, level) {
    const languages = draft.languages.filter(language => language.id !== Number(id));
    if (level) languages.push({ id: Number(id), level });
    change('languages')(languages);
  }
  return <form onSubmit={onSubmit}><fieldset disabled={busy}><legend>Offer details</legend>
    {textFields.map(([name, label]) => <Field key={name} name={name} label={label} value={draft[name]} onChange={change(name)} required={name === 'title'} />)}
    <SelectField name="category_id" label="Professional field" value={draft.category_id} options={options.categories} onChange={change('category_id')} required />
    <TownField name="location" towns={options.municipalities} value={draft.location} onChange={change('location')} required />
    {longFields.map(([name, label]) => <p key={name}><label>{label}<br /><textarea name={name} value={draft[name]} onChange={event => change(name)(event.target.value)} required={name === 'description'} maxLength={name === 'description' ? 20000 : 10000} rows={4} /></label></p>)}
    <SelectField name="minimum_qualification_id" label="Minimum studies" value={draft.minimum_qualification_id} options={options.qualifications} onChange={change('minimum_qualification_id')} />
    <SelectField name="skill_ids" label="Competencies" value={draft.skill_ids} options={options.skills} onChange={change('skill_ids')} multiple />
    {options.languages.map(language => <SelectField key={language.id} name={`language-${language.id}`} label={language.name} value={draft.languages.find(item => item.id === Number(language.id))?.level ?? ''} options={['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(level => ({ id: level, name: level }))} onChange={level => changeLanguage(language.id, level)} />)}
    {Object.entries(offerChoices).map(([name, choices]) => <SelectField key={name} name={name} label={name.replaceAll('_', ' ')} value={draft[name]} options={choices.map(([id, name]) => ({ id, name }))} onChange={change(name)} required />)}
    {numberFields.map(([name, label]) => <Field key={name} name={name} label={label} type="number" min={name === 'duration_months' ? 1 : 0} step={name === 'duration_months' ? 1 : 'any'} value={draft[name]} onChange={change(name)} />)}
    <p><label><input type="checkbox" name="immediate_start" checked={draft.immediate_start} onChange={event => { change('immediate_start')(event.target.checked); if (event.target.checked) change('start_date')(''); }} /> Immediate start</label></p>
    {!draft.immediate_start && <Field name="start_date" label="Start date" type="date" value={draft.start_date} onChange={change('start_date')} />}
    <Field name="expires_at" label="Application deadline" type="date" value={draft.expires_at} onChange={change('expires_at')} />
    <button type="submit">Save offer</button>
  </fieldset></form>;
}

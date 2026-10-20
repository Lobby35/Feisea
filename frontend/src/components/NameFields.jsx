import React from 'react';
import Field from './Field';

export default function NameFields({ values, onChange }) {
  return <>
    <Field label="Name" name="name" value={values.name} onChange={onChange('name')} required maxLength={150} autoComplete="given-name" />
    <Field label="Surname" name="surname" value={values.surname} onChange={onChange('surname')} required maxLength={150} autoComplete="family-name" />
    <Field label="Second surname (optional)" name="second_surname" value={values.second_surname} onChange={onChange('second_surname')} maxLength={150} />
  </>;
}

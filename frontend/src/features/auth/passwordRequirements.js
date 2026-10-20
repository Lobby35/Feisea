export function passwordRequirements(password) {
  return [
    { label: 'At least 12 characters', met: [...password].length >= 12 },
    { label: 'An uppercase letter', met: /\p{Lu}/u.test(password) },
    { label: 'A lowercase letter', met: /\p{Ll}/u.test(password) },
    { label: 'A number', met: /\p{N}/u.test(password) },
    { label: 'A symbol', met: /[\p{Z}\p{S}\p{P}]/u.test(password) },
    { label: 'No more than 72 bytes', met: password.length > 0 && new TextEncoder().encode(password).length <= 72 },
  ];
}

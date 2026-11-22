import { BLOOD_GROUPS, GENDERS } from './constants'
export function validateDonor(d) {
  const e = {}
  const name = (d.full_name || '').trim()
  if (name.length < 2 || name.length > 100) e.full_name = 'Name must be 2–100 characters / Magacu waa inuu noqdaa 2–100 xarfood'
  else if (!/^[\p{L}\s.'-]+$/u.test(name)) e.full_name = 'Name contains invalid characters / Magaca waxa ku jira xarfo aan la oggolayn'
  if (!GENDERS.includes(d.gender)) e.gender = 'Select a gender / Dooro jinsiga'
  const a = Number(d.age)
  if (!Number.isInteger(a) || a < 18 || a > 65) e.age = 'Age must be a whole number from 18 to 65 / Da`da waa tiro dhan oo u dhexeysa 18 ilaa 65'
  if (!/^\+?[0-9\s-]{7,15}$/.test((d.phone || '').trim())) e.phone = 'Enter a valid phone number (7–15 digits) / Geli lambar telefoon sax ah (7–15 lambar)'
  if (!BLOOD_GROUPS.includes(d.blood_group)) e.blood_group = 'Select a blood group / Dooro kooxda dhiiga'
  const c = (d.city || '').trim()
  if (c.length < 2 || c.length > 80) e.city = 'City must be 2–80 characters / Magaalada waa inay noqotaa 2–80 xarfood'
  if ((d.address || '').length > 250) e.address = 'Address max 250 characters / Cinwaanku waa inuusan ka badnaan 250 xarfood'
  return e
}

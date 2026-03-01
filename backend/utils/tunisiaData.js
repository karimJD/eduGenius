/**
 * Tunisian constants for the eduGenius educational platform
 */

const TUNISIAN_GOVERNORATES = [
  'Tunis',
  'Ariana',
  'Ben Arous',
  'Manouba',
  'Nabeul',
  'Zaghouan',
  'Bizerte',
  'Béja',
  'Jendouba',
  'Kef',
  'Siliana',
  'Sousse',
  'Monastir',
  'Mahdia',
  'Sfax',
  'Kairouan',
  'Kasserine',
  'Sidi Bouzid',
  'Gabès',
  'Medenine',
  'Tataouine',
  'Gafsa',
  'Tozeur',
  'Kébili',
];

const ACADEMIC_RANKS = [
  'assistant',
  'maitre_assistant',
  'maitre_conferences',
  'professeur',
];

const PROGRAM_TYPES = [
  'license_fundamental',
  'license_applied',
  'license_professional',
  'master_research',
  'master_professional',
  'engineering',
  'doctorate',
];

const UNIT_TYPES = [
  'fundamental',
  'specialization',
  'transversal',
  'discovery',
  'project',
];

const SESSION_TYPES = ['main', 'make-up', 'special'];

const GRADE_MENTIONS = [
  { name: 'Passable', min: 10, max: 11.99 },
  { name: 'Assez Bien', min: 12, max: 13.99 },
  { name: 'Bien', min: 14, max: 15.99 },
  { name: 'Très Bien', min: 16, max: 17.99 },
  { name: 'Excellent', min: 18, max: 20 },
];

const WEEK_DAYS = [
  { value: 0, label: 'Sunday', labelFr: 'Dimanche', labelAr: 'الأحد' },
  { value: 1, label: 'Monday', labelFr: 'Lundi', labelAr: 'الإثنين' },
  { value: 2, label: 'Tuesday', labelFr: 'Mardi', labelAr: 'الثلاثاء' },
  { value: 3, label: 'Wednesday', labelFr: 'Mercredi', labelAr: 'الأربعاء' },
  { value: 4, label: 'Thursday', labelFr: 'Jeudi', labelAr: 'الخميس' },
];

const TIME_SLOTS = [
  '08:00-09:30',
  '09:45-11:15',
  '11:30-13:00',
  '14:00-15:30',
  '15:45-17:15',
];

module.exports = {
  TUNISIAN_GOVERNORATES,
  ACADEMIC_RANKS,
  PROGRAM_TYPES,
  UNIT_TYPES,
  SESSION_TYPES,
  GRADE_MENTIONS,
  WEEK_DAYS,
  TIME_SLOTS,
};

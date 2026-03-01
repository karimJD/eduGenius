const { GRADE_MENTIONS } = require('./tunisiaData');

// Sequential counters (in production, these would be stored in DB)
let studentCounter = 1;
let employeeCounter = 1;

/**
 * Generate a student ID in format STU + year + sequential number
 * @param {number} [year] - Academic year (defaults to current year)
 * @returns {string}
 */
const generateStudentId = (year) => {
  const y = year || new Date().getFullYear();
  const seq = String(studentCounter++).padStart(4, '0');
  return `STU${y}${seq}`;
};

/**
 * Generate an employee ID for teachers in format EMP + year + sequential number
 * @param {number} [year]
 * @returns {string}
 */
const generateEmployeeId = (year) => {
  const y = year || new Date().getFullYear();
  const seq = String(employeeCounter++).padStart(4, '0');
  return `EMP${y}${seq}`;
};

/**
 * Calculate weighted average from grades with coefficients
 * @param {Array<{grade: number, coefficient: number}>} grades
 * @returns {number}
 */
const calculateAverage = (grades) => {
  if (!grades || grades.length === 0) return 0;
  const weightedSum = grades.reduce(
    (sum, g) => sum + g.grade * g.coefficient,
    0
  );
  const totalCoeff = grades.reduce((sum, g) => sum + g.coefficient, 0);
  if (totalCoeff === 0) return 0;
  return Math.round((weightedSum / totalCoeff) * 100) / 100;
};

/**
 * Get mention string based on grade using GRADE_MENTIONS
 * @param {number} grade
 * @returns {string|null}
 */
const getMentionFromGrade = (grade) => {
  if (grade < 10) return 'Ajourné';
  const mention = GRADE_MENTIONS.find((m) => grade >= m.min && grade <= m.max);
  return mention ? mention.name : null;
};

/**
 * Validate Tunisian phone number format (+216XXXXXXXX)
 * @param {string} phone
 * @returns {boolean}
 */
const validateTunisianPhone = (phone) => {
  const regex = /^\+216[0-9]{8}$/;
  return regex.test(phone);
};

module.exports = {
  generateStudentId,
  generateEmployeeId,
  calculateAverage,
  getMentionFromGrade,
  validateTunisianPhone,
};

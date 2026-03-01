/**
 * Validation middleware using manual validation (no external package needed)
 * Provides consistent validation patterns for the API
 */

const { AppError } = require('./errorHandler');

/**
 * Validate request body fields and return 400 on failure
 * @param {Function[]} validators - Array of validator functions
 */
const validate = (validators) => async (req, res, next) => {
  const errors = [];
  for (const validator of validators) {
    const result = validator(req.body);
    if (result) errors.push(result);
  }
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  next();
};

// --- Individual field validators ---
const required = (field, label) => (body) => {
  if (!body[field] || (typeof body[field] === 'string' && !body[field].trim())) {
    return `${label || field} is required`;
  }
};

const isEmail = (field) => (body) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (body[field] && !emailRegex.test(body[field])) {
    return `${field} must be a valid email address`;
  }
};

const matchesRegex = (field, regex, message) => (body) => {
  if (body[field] && !regex.test(body[field])) {
    return message || `${field} format is invalid`;
  }
};

const isIn = (field, values) => (body) => {
  if (body[field] && !values.includes(body[field])) {
    return `${field} must be one of: ${values.join(', ')}`;
  }
};

const isMongoId = (field) => (body) => {
  const mongoIdRegex = /^[a-fA-F0-9]{24}$/;
  if (body[field] && !mongoIdRegex.test(body[field])) {
    return `${field} must be a valid ID`;
  }
};

const isIntMin = (field, min) => (body) => {
  if (body[field] !== undefined) {
    const val = parseInt(body[field]);
    if (isNaN(val) || val < min) {
      return `${field} must be an integer >= ${min}`;
    }
  }
};

// --- Composed validation rule sets ---
const userValidation = [
  required('firstName', 'First name'),
  required('lastName', 'Last name'),
  required('email', 'Email'),
  required('cin', 'CIN'),
  required('role', 'Role'),
  isEmail('email'),
  matchesRegex('cin', /^[0-9]{8}$/, 'CIN must be exactly 8 digits'),
  isIn('role', ['super_admin', 'admin', 'department_head', 'program_coordinator', 'teacher', 'student', 'staff']),
];

const studentValidation = [
  ...userValidation,
  // Student-specific optional validations
  isMongoId('student.departmentId'),
  isMongoId('student.programId'),
  isMongoId('student.classId'),
];

const teacherValidation = [
  ...userValidation,
  isIn('teacher.academicRank', ['assistant', 'maitre_assistant', 'maitre_conferences', 'professeur']),
  isMongoId('teacher.departmentId'),
];

const classValidation = [
  required('name', 'Class name'),
  required('code', 'Class code'),
  required('level', 'Level'),
  isMongoId('departmentId'),
  isMongoId('programId'),
  isMongoId('academicYearId'),
  isIntMin('capacity', 1),
];

const scheduleValidation = [
  required('title', 'Schedule title'),
  isMongoId('academicYearId'),
  (body) => {
    if (!body.semester || ![1, 2].includes(Number(body.semester))) {
      return 'Semester must be 1 or 2';
    }
  },
  isIn('targetType', ['class', 'teacher', 'room']),
];

module.exports = {
  validate,
  userValidation,
  studentValidation,
  teacherValidation,
  classValidation,
  scheduleValidation,
};

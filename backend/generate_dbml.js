const mongoose = require('mongoose');
const fs = require('fs');

const TYPES_MAP = {
  String: 'varchar',
  Number: 'decimal',
  Boolean: 'boolean',
  Date: 'timestamp',
  ObjectId: 'varchar',
  Buffer: 'varchar',
  Mixed: 'text',
};

function isObjectIdLike(val) {
  return typeof val === 'string' && /^[a-f0-9]{24}$/i.test(val);
}

function formatRecordVal(val) {
  if (val === null || val === undefined) return 'null';
  if (val instanceof mongoose.Types.ObjectId) return "'" + val.toString() + "'";
  if (typeof val === 'string') {
    if (isObjectIdLike(val)) return "'" + val + "'";
    if (!isNaN(Date.parse(val)) && val.includes('T')) return "'" + val + "'";
    return "'" + val.replace(/'/g, "\\'") + "'";
  }
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (val instanceof Date) return "'" + val.toISOString() + "'";
  if (typeof val === 'object') {
    if (val && val.$oid) return "'" + val.$oid + "'";
    if (val && val.$date) return "'" + val.$date + "'";
    return "'[object]'";
  }
  return "'" + String(val) + "'";
}

function jsTypeToDBML(val) {
  if (val === null || val === undefined) return 'varchar';
  if (typeof val === 'string') {
    if (isObjectIdLike(val)) return 'varchar';
    if (!isNaN(Date.parse(val)) && val.includes('T')) return 'timestamp';
    if (val.length > 100) return 'text';
    return 'varchar';
  }
  if (typeof val === 'number') return Number.isInteger(val) ? 'integer' : 'decimal';
  if (typeof val === 'boolean') return 'boolean';
  if (val instanceof Date) return 'timestamp';
  if (Array.isArray(val)) return 'varchar';
  if (typeof val === 'object') return 'varchar';
  return 'varchar';
}

function inferFK(key) {
  const fkTargets = {
    userId: 'users', studentId: 'users', teacherId: 'users', adminId: 'users',
    senderId: 'users', receiverId: 'users', adjustedBy: 'users', verifiedBy: 'users',
    generatedBy: 'users', coordinatorId: 'users', headOfDepartmentId: 'users',
    validatedBy: 'users', academicAdvisorId: 'users',
    classId: 'classes', courseId: 'courses', subjectId: 'subjects',
    challengeId: 'arenachallenges', quizId: 'quizzes', examId: 'exams',
    scheduleId: 'schedules', videoSessionId: 'videosessions',
    departmentId: 'departments', programId: 'studyprograms',
    teachingUnitId: 'teachingunits', academicYearId: 'academicyears',
    chapterId: 'courses', exerciseId: 'worksubmissions',
    materialId: 'courses', resourceId: 'bookmarks',
    quizAttemptId: 'studentquizattempts',
    questionId: 'exams', unitId: 'teachingunits',
    targetId: null, // polymorphic, skip
  };
  const target = fkTargets[key];
  if (target === undefined) return null;
  return target;
}

async function main() {
  await mongoose.connect('mongodb://localhost:27017/eduGenius');
  const db = mongoose.connection.db;
  const colls = await db.listCollections().toArray();

  let lines = [];
  lines.push('// Generated from EduGenius MongoDB Schemas');
  lines.push('// Docs: https://dbml.dbdiagram.io/docs');
  lines.push('');

  const allDocs = {};
  const tableNames = [];

  for (const c of colls) {
    const doc = await db.collection(c.name).findOne();
    allDocs[c.name] = doc;
    tableNames.push(c.name);
  }

  // --- Table definitions ---
  const refs = [];

  for (const c of colls) {
    const doc = allDocs[c.name];
    lines.push('Table ' + c.name + ' {');

    if (doc) {
      for (const [key, val] of Object.entries(doc)) {
        if (key === '__v') continue;
        const type = key === '_id' ? 'varchar' : jsTypeToDBML(val);
        let opts = [];
        if (key === '_id') opts.push('primary key');
        if (key === 'email' || key === 'cin') opts.push('unique');

        const fkTarget = inferFK(key);
        let line = '  ' + key + ' ' + type;
        if (opts.length > 0) line += ' [' + opts.join(', ') + ']';

        // Add note for enum-like fields
        if (key === 'role' || key === 'status' || key === 'type' || key === 'messageType') {
          line += ' // enum';
        }

        lines.push(line);

        // Collect refs
        if (fkTarget && tableNames.includes(fkTarget)) {
          refs.push({ from: c.name, fromField: key, to: fkTarget, toField: '_id' });
        }
      }
    }

    lines.push('}');
    lines.push('');
  }

  // --- Refs ---
  if (refs.length > 0) {
    lines.push('// === Relationships ===');
    lines.push('');
    for (const r of refs) {
      lines.push('Ref: ' + r.to + '._id < ' + r.from + '.' + r.fromField + ' // ' + r.from + ' belongs to ' + r.to);
    }
    lines.push('');
  }

  // --- Sample Records ---
  lines.push('// === Sample Records ===');
  lines.push('');

  for (const c of colls) {
    const doc = allDocs[c.name];
    if (!doc) continue;

    const fields = Object.keys(doc).filter(k => k !== '__v');
    const fieldList = fields.join(', ');
    let values = [];
    for (const key of fields) {
      values.push(formatRecordVal(doc[key]));
    }
    lines.push('Records ' + c.name + '(' + fieldList + ') {');
    lines.push('  ' + values.join(', '));
    lines.push('}');
    lines.push('');
  }

  const output = lines.join('\n');
  fs.writeFileSync('mongomodeler_schemas.dbml', output);
  console.log('Written to mongomodeler_schemas.dbml');
  console.log(output.slice(0, 2000) + '\n...');

  await mongoose.disconnect();
}

main().catch(err => { console.error(err.message); process.exit(1); });

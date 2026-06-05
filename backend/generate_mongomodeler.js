const mongoose = require('mongoose');
const fs = require('fs');

let fieldCounter = 0;
function fId() { return 'f' + (++fieldCounter); }

function inferType(val) {
  if (val === null || val === undefined) return 'String';
  if (typeof val === 'string') return 'String';
  if (typeof val === 'number') return 'Number';
  if (typeof val === 'boolean') return 'Boolean';
  if (val instanceof Date || (typeof val === 'string' && !isNaN(Date.parse(val)))) return 'Date';
  if (Buffer.isBuffer(val)) return 'Buffer';
  if (Array.isArray(val)) return 'Array';
  if (typeof val === 'object') return 'Object';
  return 'String';
}

function isObjectId(str) {
  return typeof str === 'string' && /^[a-f0-9]{24}$/i.test(str);
}

function isDateStr(str) {
  return typeof str === 'string' && !isNaN(Date.parse(str)) && str.includes('T');
}

function processValue(key, val, parentIsArray = false) {
  const fieldId = fId();
  const field = { id: fieldId, name: key };

  if (key === '_id') {
    field.type = 'ObjectId';
    field.isPK = true;
    return field;
  }

  if (key.endsWith('Id') || key.endsWith('Ids') || key === 'userId' || key === 'studentId' || 
      key === 'teacherId' || key === 'classId' || key === 'courseId' || key === 'subjectId' ||
      key === 'challengeId' || key === 'scheduleId' || key === 'departmentId' ||
      key === 'programId' || key === 'unitId' || key === 'exerciseId' ||
      key === 'chapterId' || key === 'quizId' || key === 'examId' ||
      key === 'questionId' || key === 'materialId' || key === 'resourceId') {
    field.type = 'ObjectId';
    field.isFK = true;
    return field;
  }

  if (val === null || val === undefined) {
    field.type = 'String';
    return field;
  }

  if (typeof val === 'string') {
    if (isObjectId(val)) {
      field.type = 'ObjectId';
      field.isFK = true;
    } else if (isDateStr(val)) {
      field.type = 'Date';
    } else {
      field.type = 'String';
    }
    return field;
  }

  if (typeof val === 'number') {
    field.type = 'Number';
    return field;
  }

  if (typeof val === 'boolean') {
    field.type = 'Boolean';
    return field;
  }

  if (val instanceof Date || typeof val === 'object' && val.$date) {
    field.type = 'Date';
    return field;
  }

  if (Array.isArray(val)) {
    if (val.length === 0) {
      field.type = 'Array';
      return field;
    }
    const first = val[0];
    if (typeof first === 'object' && first !== null && !Array.isArray(first)) {
      const subFields = [];
      for (const [sk, sv] of Object.entries(first)) {
        subFields.push(processValue(sk, sv, true));
      }
      field.type = 'Array';
      field.fields = subFields;
    } else {
      const elemType = typeof first === 'string' ? (isObjectId(first) ? 'ObjectId' : 'String') :
                       typeof first === 'number' ? 'Number' :
                       typeof first === 'boolean' ? 'Boolean' : 'String';
      field.type = '[' + elemType + ']';
    }
    return field;
  }

  if (typeof val === 'object') {
    const subFields = [];
    for (const [sk, sv] of Object.entries(val)) {
      subFields.push(processValue(sk, sv));
    }
    field.type = 'Object';
    field.fields = subFields;
    return field;
  }

  field.type = 'String';
  return field;
}

async function main() {
  await mongoose.connect('mongodb://localhost:27017/eduGenius');
  const db = mongoose.connection.db;
  const colls = await db.listCollections().toArray();

  const allSeenKeys = {};

  const result = [];
  let collIdx = 0;

  for (const c of colls) {
    collIdx++;
    const doc = await db.collection(c.name).findOne();
    fieldCounter = 0;

    const fields = [];
    if (doc) {
      for (const [key, val] of Object.entries(doc)) {
        if (key === '__v') continue;
        fields.push(processValue(key, val));
      }
    }

    result.push({
      id: String(collIdx),
      name: c.name,
      fields: fields
    });

    console.log('OK: ' + c.name + ' (' + fields.length + ' fields)');
  }

  fs.writeFileSync('mongomodeler_schemas.json', JSON.stringify(result, null, 2));
  console.log('\nWritten to mongomodeler_schemas.json');
  await mongoose.disconnect();
}

main().catch(err => { console.error(err.message); process.exit(1); });

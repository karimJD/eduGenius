const axios = require('axios');

async function test() {
  try {
    const res = await axios.get('http://localhost:5000/api/student/ai/practice-quizzes/history', {
      headers: {
        'Authorization': 'Bearer test' // Just to get a 401 instead of 404 if it exists
      }
    });
    console.log("HISTORY:", res.status);
  } catch (err) {
    console.log("HISTORY ERR:", err.response ? err.response.status : err.message);
  }

  try {
    const res = await axios.get('http://localhost:5000/api/student/ai/courses', {
      headers: {
        'Authorization': 'Bearer test'
      }
    });
    console.log("COURSES:", res.status);
  } catch (err) {
    console.log("COURSES ERR:", err.response ? err.response.status : err.message);
  }
}

test();

const CourseRepository = require('../repositories/CourseRepository');
const AiService = require('./AiService');

class CourseService {
  async processNewCourse(title, content) {
    // 1. Generate Quiz using AI
    const quiz = await AiService.generateQuiz(content);
    
    // 2. Generate Summary using AI
    const summary = await AiService.generateSummary(content);

    // 3. Save to Database
    const course = await CourseRepository.createCourse({
      title,
      content,
      quiz,
      summary
    });

    return course;
  }

  async getAllCourses() {
    return await CourseRepository.getAllCourses();
  }

  async getCourseById(id) {
    return await CourseRepository.getCourseById(id);
  }

  async ensureQuizCount(courseId, count) {
    const course = await this.getCourseById(courseId);
    if (!course) throw new Error('Course not found');

    if (course.quiz.length < count) {
      const needed = count - course.quiz.length;
      // Generate additional questions
      // We use the course content (or summary if content is missing/too large, though content is preferred)
      const newQuestions = await AiService.generateQuiz(course.content || course.summary, needed);
      
      // Append new questions
      course.quiz.push(...newQuestions);
      await course.save();
    }
    
    return course;
  }

  async deleteCourse(id) {
    return await CourseRepository.deleteCourse(id);
  }

  async updateCourse(id, courseData) {
    return await CourseRepository.updateCourse(id, courseData);
  }
}

module.exports = new CourseService();

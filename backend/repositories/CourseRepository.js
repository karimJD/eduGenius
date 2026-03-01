const Course = require('../models/Course');

class CourseRepository {
  async createCourse(courseData) {
    const course = new Course(courseData);
    return await course.save();
  }

  async getAllCourses() {
    return await Course.find().sort({ createdAt: -1 });
  }

  async getCourseById(id) {
    return await Course.findById(id);
  }

  async deleteCourse(id) {
    return await Course.findByIdAndDelete(id);
  }

  async updateCourse(id, courseData) {
    return await Course.findByIdAndUpdate(id, courseData, { new: true });
  }
}

module.exports = new CourseRepository();

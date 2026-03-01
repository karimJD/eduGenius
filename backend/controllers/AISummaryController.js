const AISummary = require('../models/AISummary');
const AiService = require('../services/AiService');
const Course = require('../models/Course');

// @desc    Get or generate AI summary for student
// @route   POST /api/ai/summary
// @access  Private
exports.getStudentSummary = async (req, res) => {
    try {
        const { courseId, type, style } = req.body;
        const studentId = req.user._id;

        // Check if summary already exists
        let summary = await AISummary.findOne({ studentId, courseId, summaryType: type || 'std' });

        if (summary) {
            return res.json(summary);
        }

        // Generate new summary
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const generatedContent = await AiService.generateEnhancedSummary(course.content || course.summary, style);

        summary = await AISummary.create({
            studentId,
            courseId,
            content: generatedContent,
            summaryType: type || 'std',
            customizations: { style: style || 'cheatSheet' }
        });

        res.status(201).json(summary);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

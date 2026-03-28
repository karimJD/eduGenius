'use client';

import { useEffect, useState } from 'react';
import { BookOpen, ChevronRight, Calendar, PlusCircle } from 'lucide-react';
import api from '@/lib/axios';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Course {
  _id: string;
  title: string;
  classId?: { _id: string; name: string; code: string };
  chapters: any[];
  isPublished: boolean;
  updatedAt: string;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/teacher/courses')
      .then(r => setCourses(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Course Materials</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage chapters and materials for your classes.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-card border border-border rounded-2xl animate-pulse" />)}
        </div>
      ) : courses.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No courses yet</p>
          <p className="text-sm mt-1">Navigate to a class and open Course Materials to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course, i) => (
            <motion.div
              key={course._id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={course.classId ? `/teacher/courses/${course.classId._id}` : '#'}
                className="flex items-center gap-4 p-5 bg-card border border-border rounded-2xl hover:border-primary/40 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{course.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {course.classId && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {course.classId.name} ({course.classId.code})
                      </span>
                    )}
                    <span>{course.chapters.length} chapters</span>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${course.isPublished ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

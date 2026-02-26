import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Layers, Clock, AlertCircle, CheckCircle, HelpCircle, ArrowRight, RefreshCw, Edit } from 'lucide-react';
import { getCourses, getStats, getRecentQuestions, getUnsolvedQuestions, isReadOnly } from '../api';
import EditCourseModal from '../components/EditCourseModal';

export default function Dashboard() {
  const readOnly = isReadOnly();
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({ courses: 0, questions: 0, solved: 0, unsolved: 0 });
  const [recent, setRecent] = useState([]);
  const [unsolved, setUnsolved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCourse, setEditingCourse] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
        // Fetch stats first as they are critical
        const statsData = await getStats();
        setStats(statsData);
    } catch (err) {
        console.error("Failed to load stats", err);
    }

    try {
        const coursesData = await getCourses();
        setCourses(coursesData);
    } catch (err) {
        console.error("Failed to load courses", err);
    }

    try {
        const recentData = await getRecentQuestions();
        setRecent(recentData);
    } catch (err) {
        console.error("Failed to load recent questions", err);
    }

    try {
        const unsolvedData = await getUnsolvedQuestions();
        setUnsolved(unsolvedData);
    } catch (err) {
        console.error("Failed to load unsolved questions", err);
    }
    
    setLoading(false);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;

  const DifficultyBadge = ({ level }) => {
    const configs = {
        0: { label: 'Undefined', color: 'bg-gray-100 text-gray-600' },
        1: { label: 'Easy', color: 'bg-green-100 text-green-700' },
        3: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
        5: { label: 'Hard', color: 'bg-red-100 text-red-700' }
    };
    const config = configs[level] || configs[0];
    return (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tighter ${config.color}`}>
            {config.label}
        </span>
    );
  };

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black text-text-main tracking-tighter">Dashboard</h1>
          <p className="text-text-muted mt-1 font-medium">Your academic overview.</p>
        </div>
        <button 
          onClick={loadData}
          className="p-2 text-text-muted hover:text-primary hover:bg-bg-surface rounded-xl transition-all border border-border-main shadow-sm"
          title="Refresh Dashboard"
          disabled={loading}
        >
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Courses', value: stats.courses, icon: Layers, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Total Questions', value: stats.questions, icon: HelpCircle, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { label: 'Solved', value: stats.solved, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Unsolved', value: stats.unsolved, icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        ].map((item, idx) => (
          <div key={idx} className="bg-bg-surface p-6 rounded-2xl shadow-sm border border-border-main flex items-center gap-4 transition-transform hover:scale-[1.02]">
            <div className={`${item.bg} p-3 rounded-xl ${item.color}`}>
                <item.icon size={24} />
            </div>
            <div>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{item.label}</p>
                <p className="text-2xl font-black text-text-main leading-none mt-1">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Courses & Recents */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* Courses */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-black text-text-main flex items-center gap-2 uppercase tracking-tight">
                        <BookOpen size={20} className="text-primary" /> Your Courses
                    </h2>
                </div>
                {courses.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {courses.map(course => (
                            <Link 
                                key={course.id} 
                                to={`/courses/${course.id}`}
                                className="group bg-bg-surface p-5 rounded-2xl shadow-sm border border-border-main hover:shadow-md hover:border-primary transition-all relative overflow-hidden"
                            >
                                <div className="flex justify-between items-start mb-3 relative z-10">
                                    <span className="bg-accent text-primary text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest border border-primary/10">
                                        {course.code}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {!readOnly && (
                                            <button 
                                                onClick={(e) => { e.preventDefault(); setEditingCourse(course); }}
                                                className="p-1.5 text-text-muted hover:text-primary hover:bg-accent rounded-lg transition-colors"
                                            >
                                                <Edit size={14} />
                                            </button>
                                        )}
                                        <ArrowRight size={16} className="text-text-muted group-hover:text-primary transition-colors group-hover:translate-x-1" />
                                    </div>
                                </div>
                                <h3 className="font-black text-text-main truncate text-lg tracking-tight relative z-10">{course.title}</h3>
                                <p className="text-sm text-text-muted line-clamp-2 mt-1 relative z-10 font-medium">
                                    {course.description || "No description provided."}
                                </p>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="bg-bg-surface/50 p-10 rounded-3xl text-center border-2 border-dashed border-border-main">
                        <p className="text-text-muted font-bold mb-2">No courses found.</p>
                        <p className="text-xs text-text-muted opacity-60">Use the sidebar to add your first course and start studying.</p>
                    </div>
                )}
            </section>

            {/* Recent Questions */}
            <section>
                <h2 className="text-xl font-black text-text-main mb-4 flex items-center gap-2 uppercase tracking-tight">
                    <Clock size={20} className="text-text-muted" /> Recently Added
                </h2>
                {recent.length > 0 ? (
                    <div className="bg-bg-surface rounded-2xl shadow-sm border border-border-main divide-y divide-border-main overflow-hidden">
                        {recent.map(q => (
                            <Link 
                                key={q.id} 
                                to={`/questions/${q.id}`}
                                className="flex items-center gap-4 p-4 hover:bg-accent transition-colors group"
                            >
                                <div className="w-12 h-12 bg-bg-main rounded-xl flex items-center justify-center flex-shrink-0 text-text-muted font-black text-[10px] border border-border-main group-hover:border-primary/20 transition-colors">
                                    {q.course_code}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-text-main truncate group-hover:text-primary transition-colors flex items-center gap-2">
                                            {q.question_number && <span className="bg-bg-main px-1 py-0.5 rounded text-[9px] border border-border-main">Q{q.question_number}</span>}
                                            {q.title}
                                        </h4>
                                        <DifficultyBadge level={q.difficulty} />
                                    </div>
                                    <p className="text-xs text-text-muted font-medium mt-0.5">
                                        Added {new Date(q.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <ArrowRight size={16} className="text-text-muted group-hover:text-primary transition-colors group-hover:translate-x-1" />
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="bg-bg-surface/30 p-6 rounded-2xl border border-border-main border-dashed text-center">
                        <p className="text-text-muted text-sm font-bold italic">No recent questions.</p>
                    </div>
                )}
            </section>
        </div>

        {/* Right Column: Unsolved */}
        <div className="space-y-8">
            <section>
                <h2 className="text-xl font-black text-text-main mb-4 flex items-center gap-2 uppercase tracking-tight">
                    <AlertCircle size={20} className="text-orange-500" /> Needs Solutions
                </h2>
                {unsolved.length > 0 ? (
                    <div className="space-y-3">
                        {unsolved.map(q => (
                            <Link 
                                key={q.id} 
                                to={`/questions/${q.id}`}
                                className="block bg-bg-surface p-4 rounded-2xl shadow-sm border border-border-main hover:border-orange-500/30 transition-all group"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{q.course_code}</span>
                                    <DifficultyBadge level={q.difficulty} />
                                </div>
                                <h4 className="font-bold text-text-main group-hover:text-orange-500 line-clamp-2 leading-snug flex items-start gap-2">
                                    {q.question_number && <span className="bg-orange-500/10 text-orange-600 px-1 py-0.5 rounded text-[9px] border border-orange-500/20 shrink-0">Q{q.question_number}</span>}
                                    {q.title}
                                </h4>
                                <div className="mt-4 pt-3 border-t border-border-main flex items-center justify-between">
                                    <div className="text-[10px] text-orange-500 font-black uppercase tracking-widest flex items-center gap-1">
                                        Solve Now <ArrowRight size={10} />
                                    </div>
                                    <span className="text-[10px] text-text-muted font-bold">{new Date(q.created_at).toLocaleDateString()}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="bg-green-500/5 p-8 rounded-3xl text-center border border-green-500/20">
                        <CheckCircle size={40} className="text-green-500 mx-auto mb-3 opacity-50" />
                        <p className="text-green-600 font-black uppercase tracking-tighter text-sm">All Caught Up!</p>
                        <p className="text-[10px] text-green-600/60 mt-1 font-bold">No questions waiting for solutions.</p>
                    </div>
                )}
            </section>
        </div>
      </div>

      {editingCourse && (
        <EditCourseModal 
            course={editingCourse}
            onClose={() => setEditingCourse(null)}
            onCourseUpdated={() => { loadData(); setEditingCourse(null); }}
            onCourseDeleted={() => { loadData(); setEditingCourse(null); }}
        />
      )}
    </div>
  );
}
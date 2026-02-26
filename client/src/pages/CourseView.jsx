import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, BookOpen, ArrowDownUp, 
  Calendar, LayoutList, LayoutGrid, FolderTree, 
  Tag as TagIcon, CheckCircle2, Circle, ChevronRight, 
  Eye, Clock, Image as ImageIcon, X, AlertTriangle, ListFilter,
  Printer
} from 'lucide-react';
import { getQuestions, getCourses, getTags, isReadOnly, getImageUrl } from '../api';
import AddQuestionModal from '../components/AddQuestionModal';

export default function CourseView() {
  const navigate = useNavigate();
  const readOnly = isReadOnly();
  const { courseId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('question_number');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showModal, setShowModal] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list', 'card', 'group'
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState([]);

  // Compute tags specific to this course
  const courseTags = useMemo(() => {
    const tagMap = new Map();
    questions.forEach(q => {
        q.tags?.forEach(t => {
            tagMap.set(t.id, t.name);
        });
    });
    return Array.from(tagMap.entries()).map(([id, name]) => ({ id, name }));
  }, [questions]);

  // Compute years specific to this course
  const courseYears = useMemo(() => {
    const years = new Set();
    questions.forEach(q => {
        if (q.year) years.add(q.year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [questions]);

  // Compute types specific to this course
  const courseTypes = useMemo(() => {
    const types = new Set();
    questions.forEach(q => {
        if (q.type) types.add(q.type);
    });
    return Array.from(types).sort();
  }, [questions]);

  useEffect(() => {
    loadQuestions();
    getCourses().then(courses => {
        const c = courses.find(c => c.id == courseId);
        if (c) setCourseTitle(`${c.code} - ${c.title}`);
    });
  }, [courseId, searchTerm, sortBy, sortOrder]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await getQuestions(courseId, searchTerm, sortBy, sortOrder);
      setQuestions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = useMemo(() => {
    let filtered = [...questions]; // Create a copy to sort
    
    if (selectedTags.length > 0) {
        filtered = filtered.filter(q => 
            selectedTags.every(tag => q.tags?.some(t => t.name === tag))
        );
    }

    if (selectedYears.length > 0) {
        filtered = filtered.filter(q => selectedYears.includes(q.year));
    }

    if (selectedTypes.length > 0) {
        filtered = filtered.filter(q => selectedTypes.includes(q.type));
    }

    if (selectedDifficulties.length > 0) {
        filtered = filtered.filter(q => selectedDifficulties.includes(q.difficulty));
    }

    // Client-side natural sorting for alphanumeric titles and static mode support
    filtered.sort((a, b) => {
        let valA = a[sortBy] || '';
        let valB = b[sortBy] || '';

        let comparison = 0;
        if (typeof valA === 'string' && typeof valB === 'string') {
            // Natural sort: Question 1, Question 2, Question 10...
            comparison = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
        } else {
            if (valA < valB) comparison = -1;
            if (valA > valB) comparison = 1;
        }

        return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [questions, selectedTags, selectedYears, selectedTypes, selectedDifficulties, sortBy, sortOrder]);

  const groupedQuestions = useMemo(() => {
    const groups = {};
    filteredQuestions.forEach(q => {
        const year = q.year || 'Unknown Year';
        if (!groups[year]) groups[year] = [];
        groups[year].push(q);
    });
    return Object.keys(groups)
        .sort((a, b) => sortOrder === 'desc' ? b - a : a - b)
        .reduce((obj, key) => {
            // Keep the already filtered and naturally sorted order within groups
            obj[key] = groups[key];
            return obj;
        }, {});
  }, [filteredQuestions, sortOrder]);

  const toggleTag = (e, tagName) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setSelectedTags(prev => 
        prev.includes(tagName) ? prev.filter(t => t !== tagName) : [...prev, tagName]
    );
  };

  const toggleYear = (year) => {
    setSelectedYears(prev => 
        prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
    );
  };

  const toggleType = (type) => {
    setSelectedTypes(prev => 
        prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleDifficulty = (level) => {
    setSelectedDifficulties(prev => 
        prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };

  const stats = useMemo(() => {
    const total = questions.length;
    const solved = questions.filter(q => q.solution_count > 0).length;
    return { total, solved, percent: total > 0 ? (solved / total) * 100 : 0 };
  }, [questions]);

  const handleExportPDF = () => {
    const params = new URLSearchParams();
    selectedYears.forEach(y => params.append('year', y));
    selectedTypes.forEach(t => params.append('type', t));
    selectedTags.forEach(t => params.append('tag', t));
    params.append('sortBy', sortBy);
    params.append('sortOrder', sortOrder);
    navigate(`/courses/${courseId}/print?${params.toString()}`);
  };

  // --- Sub-Components for Views ---

  const QuestionStatus = ({ solved }) => (
    solved > 0 
        ? <CheckCircle2 size={16} className="text-green-500" title="Solved" /> 
        : <Circle size={16} className="text-gray-300" title="Unsolved" />
  );

  const DifficultyBadge = ({ level }) => {
    const configs = {
        0: { label: 'Undefined', color: 'bg-gray-100 text-gray-600' },
        1: { label: 'Easy', color: 'bg-green-100 text-green-700 border-green-200' },
        3: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
        5: { label: 'Hard', color: 'bg-red-100 text-red-700 border-red-200' }
    };
    const config = configs[level] || configs[0];
    const isActive = selectedDifficulties.includes(level);

    return (
        <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleDifficulty(level); }}
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter border transition-all hover:scale-105 active:scale-95 ${
                isActive 
                ? 'bg-gray-800 text-white border-gray-800 shadow-sm' 
                : `${config.color} hover:brightness-95`
            }`}
        >
            {config.label}
        </button>
    );
  };

  const TypeBadge = ({ type }) => {
    if (!type) return null;
    const isActive = selectedTypes.includes(type);
    return (
        <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleType(type); }}
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter border transition-all hover:scale-105 active:scale-95 ${
                isActive 
                ? 'bg-purple-800 text-white border-purple-800 shadow-sm' 
                : 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100'
            }`}
        >
            {type}
        </button>
    );
  };

  const TagList = ({ tags, size = "sm" }) => (
    <div className="flex flex-wrap gap-1 mt-1">
        {tags?.map(t => (
            <button 
                key={t.id} 
                onClick={(e) => toggleTag(e, t.name)}
                className={`${size === "xs" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5"} rounded font-medium transition-colors ${
                    selectedTags.includes(t.name)
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-bg-main text-text-muted hover:bg-accent'
                }`}
            >
                #{t.name}
            </button>
        ))}
    </div>
  );

  const ListView = () => (
    <div className="bg-bg-surface rounded-2xl shadow-sm border border-border-main overflow-hidden divide-y divide-border-main">
        {filteredQuestions.map((q) => (
            <Link key={q.id} to={`/questions/${q.id}`} className="flex items-center p-4 hover:bg-accent hover:border-l-4 hover:border-primary transition-all group">
                <div className="mr-4 flex-shrink-0">
                    <QuestionStatus solved={q.solution_count} />
                </div>
                <div className="w-14 h-14 bg-bg-main rounded-xl flex-shrink-0 overflow-hidden border border-border-main mr-4 group-hover:border-primary/20 transition-colors">
                    {q.thumbnail_path || q.image_path ? (
                        <img src={getImageUrl(q.thumbnail_path || q.image_path)} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-muted">
                            <ImageIcon size={20} />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleYear(q.year); }}
                            className={`text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest transition-all ${
                                selectedYears.includes(q.year)
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-accent text-primary hover:bg-primary/10'
                            }`}
                        >
                            {q.year}
                        </button>
                        <TypeBadge type={q.type} />
                        <h3 className="font-bold text-text-main truncate group-hover:text-primary transition-colors text-base tracking-tight flex items-center gap-2">
                            {q.question_number && <span className="bg-bg-main px-1.5 py-0.5 rounded text-[10px] border border-border-main">Q{q.question_number}</span>}
                            {q.title || 'Untitled Question'}
                        </h3>
                        <DifficultyBadge level={q.difficulty} />
                    </div>
                    <TagList tags={q.tags} size="xs" />
                </div>
                <div className="ml-4 text-text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                    <ChevronRight size={20} />
                </div>
            </Link>
        ))}
    </div>
  );

  const CardView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuestions.map((q) => (
            <Link key={q.id} to={`/questions/${q.id}`} className="bg-bg-surface rounded-3xl shadow-sm border border-border-main overflow-hidden hover:shadow-xl hover:border-primary transition-all flex flex-col group relative">
                <div className="aspect-[16/10] bg-bg-main relative overflow-hidden">
                    {q.thumbnail_path || q.image_path ? (
                        <img src={getImageUrl(q.thumbnail_path || q.image_path)} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-muted opacity-20">
                            <ImageIcon size={64} />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
                        <div className="bg-bg-surface/90 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-white/10">
                            <QuestionStatus solved={q.solution_count} />
                        </div>
                        <DifficultyBadge level={q.difficulty} />
                    </div>
                    <div className="absolute bottom-3 left-3 flex gap-1.5">
                        <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleYear(q.year); }}
                            className={`backdrop-blur-md text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest transition-all shadow-lg border border-white/10 ${
                                selectedYears.includes(q.year)
                                ? 'bg-primary text-white'
                                : 'bg-black/40 text-white hover:bg-black/60'
                            }`}
                        >
                            {q.year}
                        </button>
                        {q.type && (
                            <button 
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleType(q.type); }}
                                className={`backdrop-blur-md text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest transition-all shadow-lg border border-white/10 ${
                                    selectedTypes.includes(q.type)
                                    ? 'bg-primary text-white'
                                    : 'bg-black/40 text-white hover:bg-black/60'
                                }`}
                            >
                                {q.type}
                            </button>
                        )}
                    </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                        <h3 className="font-black text-text-main group-hover:text-primary transition-colors line-clamp-2 mb-3 text-lg leading-tight tracking-tight flex items-start gap-2">
                            {q.question_number && <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] border border-primary/20 shrink-0">Q{q.question_number}</span>}
                            <span>{q.title || 'Untitled Question'}</span>
                        </h3>
                        <TagList tags={q.tags} />
                    </div>
                    <div className="mt-4 pt-4 border-t border-border-main flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><Clock size={12} className="text-primary" /> {new Date(q.created_at).toLocaleDateString()}</span>
                        {q.solution_count > 0 ? (
                            <span className="text-green-500 flex items-center gap-1"><CheckCircle2 size={12} /> Solved</span>
                        ) : (
                            <span className="text-orange-500 flex items-center gap-1"><Circle size={12} /> Unsolved</span>
                        )}
                    </div>
                </div>
            </Link>
        ))}
    </div>
  );

  const GroupView = () => (
    <div className="space-y-10">
        {Object.entries(groupedQuestions).map(([year, qs]) => (
            <div key={year} className="animate-in fade-in slide-in-from-left duration-500">
                <div className="flex items-center gap-4 mb-6">
                    <div className="bg-primary text-white p-2.5 rounded-2xl shadow-lg shadow-primary/20">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-text-main tracking-tighter">{year}</h2>
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{qs.length} Questions in this block</span>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-border-main to-transparent ml-4"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {qs.map(q => (
                        <Link key={q.id} to={`/questions/${q.id}`} className="bg-bg-surface p-5 rounded-2xl border border-border-main hover:border-primary hover:shadow-xl transition-all group relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <QuestionStatus solved={q.solution_count} />
                                <div className="flex flex-col items-end gap-1.5">
                                    <DifficultyBadge level={q.difficulty} />
                                    <TypeBadge type={q.type} />
                                </div>
                            </div>
                            <h4 className="font-bold text-text-main group-hover:text-primary transition-colors line-clamp-2 text-sm leading-relaxed mb-4">
                                {q.title}
                            </h4>
                            <div className="space-y-3">
                                <TagList tags={q.tags} size="xs" />
                                <div className="pt-3 border-t border-border-main flex justify-between items-center">
                                    <span className="text-[10px] font-black text-text-muted/40 font-mono tracking-tighter">ID: {q.id.toString().padStart(4, '0')}</span>
                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Open <ChevronRight size={10} />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        ))}
    </div>
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
            <Link to="/" className="hover:text-primary transition-colors">Archive</Link>
            <ChevronRight size={10} />
            <span className="text-text-main">Library</span>
          </div>
          <h1 className="text-5xl font-black text-text-main tracking-tighter leading-none">{courseTitle || 'Loading...'}</h1>
          
          {/* Progress Tracker */}
          <div className="flex items-center gap-5 pt-4 max-w-lg">
            <div className="flex-1 h-4 bg-bg-main rounded-2xl p-1 shadow-inner border border-border-main relative overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-xl transition-all duration-1000 ease-out shadow-sm" 
                    style={{ width: `${stats.percent}%` }}
                >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
            </div>
            <div className="flex flex-col">
                <span className="text-xl font-black text-text-main leading-none tracking-tighter">{Math.round(stats.percent)}%</span>
                <span className="text-[9px] font-black text-text-muted uppercase tracking-widest mt-1">Mastery</span>
            </div>
            <div className="bg-bg-surface px-3 py-1.5 rounded-xl border border-border-main shadow-sm flex items-center gap-2">
                <CheckCircle2 size={12} className="text-green-500" />
                <span className="text-[10px] font-black text-text-main tracking-tighter">{stats.solved} / {stats.total}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex bg-bg-main p-1.5 rounded-2xl border border-border-main shadow-inner">
                <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-bg-surface text-primary shadow-lg border border-border-main' : 'text-text-muted hover:text-text-main'}`}
                    title="List View"
                >
                    <LayoutList size={20} />
                </button>
                <button 
                    onClick={() => setViewMode('group')}
                    className={`p-2.5 rounded-xl transition-all ${viewMode === 'group' ? 'bg-bg-surface text-primary shadow-lg border border-border-main' : 'text-text-muted hover:text-text-main'}`}
                    title="Group by Year"
                >
                    <FolderTree size={20} />
                </button>
                <button 
                    onClick={() => setViewMode('card')}
                    className={`p-2.5 rounded-xl transition-all ${viewMode === 'card' ? 'bg-bg-surface text-primary shadow-lg border border-border-main' : 'text-text-muted hover:text-text-main'}`}
                    title="Card View"
                >
                    <LayoutGrid size={20} />
                </button>
            </div>

            <button 
                onClick={handleExportPDF}
                className="flex items-center gap-3 bg-bg-surface text-text-main border border-border-main hover:bg-bg-main px-6 py-3 rounded-2xl shadow-sm transition-all font-black uppercase tracking-widest text-xs"
                title="Export filtered questions to PDF"
            >
                <Printer size={20} />
                <span>Export PDF</span>
            </button>

            {!readOnly && (
                <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-3 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-2xl shadow-xl shadow-primary/20 transition-all font-black uppercase tracking-widest text-xs"
                >
                    <Plus size={20} strokeWidth={3} />
                    <span>Add Question</span>
                </button>
            )}
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-bg-surface p-6 rounded-3xl shadow-sm border border-border-main space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={20} />
                <input 
                    type="text" 
                    placeholder="Search by title, notes, or anything... (Ctrl+K)" 
                    className="w-full pl-14 pr-6 py-4 bg-bg-main border border-border-main rounded-2xl focus:ring-2 focus:ring-primary focus:bg-bg-surface outline-none transition-all text-sm font-bold text-text-main placeholder:text-text-muted/50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex items-center bg-bg-main border border-border-main rounded-2xl px-5 py-3.5">
                    <ArrowDownUp size={18} className="text-text-muted mr-3" />
                    <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-transparent text-sm font-black text-text-main outline-none cursor-pointer appearance-none pr-8 uppercase tracking-widest"
                    >
                        <option value="question_number">Number</option>
                        <option value="year">Year</option>
                        <option value="type">Type</option>
                        <option value="difficulty">Difficulty</option>
                        <option value="created_at">Date</option>
                        <option value="title">Title</option>
                        <option value="tags">Tags</option>
                    </select>
                </div>
                
                <button 
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="p-4 border border-border-main rounded-2xl bg-bg-main hover:bg-bg-surface text-text-main transition-all shadow-sm active:scale-95"
                    title={sortOrder === 'asc' ? "Ascending" : "Descending"}
                >
                    <ArrowDownUp size={20} className={`${sortOrder === 'desc' ? "rotate-180" : ""} transition-transform duration-500`} />
                </button>
            </div>
        </div>

        {/* Dynamic Filters Cloud */}
        {(selectedTags.length > 0 || selectedYears.length > 0 || selectedTypes.length > 0 || selectedDifficulties.length > 0 || sortBy === 'tags' || sortBy === 'year' || sortBy === 'type' || sortBy === 'difficulty') && (
            <div className="pt-6 border-t border-border-main space-y-6">
                
                {/* Reset Bar */}
                {(selectedTags.length > 0 || selectedYears.length > 0 || selectedTypes.length > 0 || selectedDifficulties.length > 0) && (
                    <div className="flex justify-between items-center bg-accent/50 p-3 rounded-2xl border border-primary/10">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Active Filters Enabled</span>
                        <button 
                            onClick={() => { setSelectedTags([]); setSelectedYears([]); setSelectedTypes([]); setSelectedDifficulties([]); }}
                            className="flex items-center gap-2 px-4 py-1.5 bg-bg-surface hover:bg-red-500 hover:text-white text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border border-border-main"
                        >
                            <X size={12} /> Clear All Filters
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Types */}
                    {(sortBy === 'type' || selectedTypes.length > 0) && courseTypes.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
                                <ListFilter size={12} className="text-purple-500" /> Filter Types
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {courseTypes.map(type => (
                                    <button
                                        key={type}
                                        onClick={() => toggleType(type)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${
                                            selectedTypes.includes(type)
                                            ? 'bg-primary text-white border-primary shadow-md'
                                            : 'bg-bg-main text-text-muted border-border-main hover:bg-accent'
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Years */}
                    {(sortBy === 'year' || selectedYears.length > 0) && courseYears.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
                                <Calendar size={12} className="text-blue-500" /> Filter Years
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {courseYears.map(year => (
                                    <button
                                        key={year}
                                        onClick={() => toggleYear(year)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${
                                            selectedYears.includes(year)
                                            ? 'bg-primary text-white border-primary shadow-md'
                                            : 'bg-bg-main text-text-muted border-border-main hover:bg-accent'
                                        }`}
                                    >
                                        {year}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Difficulty */}
                    {(sortBy === 'difficulty' || selectedDifficulties.length > 0) && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
                                <AlertTriangle size={12} className="text-orange-500" /> Filter Difficulty
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {[1, 3, 5, 0].map(level => {
                                    const labels = { 1: 'Easy', 3: 'Medium', 5: 'Hard', 0: 'Undefined' };
                                    const colors = { 
                                        1: 'text-green-600', 
                                        3: 'text-yellow-600', 
                                        5: 'text-red-600', 
                                        0: 'text-text-muted'
                                    };
                                    const isActive = selectedDifficulties.includes(level);
                                    return (
                                        <button
                                            key={level}
                                            onClick={() => toggleDifficulty(level)}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${
                                                isActive 
                                                ? 'bg-primary text-white border-primary shadow-md'
                                                : `bg-bg-main ${colors[level]} border-border-main hover:bg-accent`
                                            }`}
                                        >
                                            {labels[level]}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Tags */}
                    {(sortBy === 'tags' || selectedTags.length > 0) && courseTags.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
                                <TagIcon size={12} className="text-green-500" /> Filter Tags
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {courseTags.map(tag => (
                                    <button
                                        key={tag.id}
                                        onClick={() => toggleTag(null, tag.name)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${
                                            selectedTags.includes(tag.name)
                                            ? 'bg-primary text-white border-primary shadow-md'
                                            : 'bg-bg-main text-text-muted border-border-main hover:bg-accent'
                                        }`}
                                    >
                                        {tag.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="min-h-[400px]">
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-text-muted gap-6">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen size={20} className="text-primary animate-pulse" />
                    </div>
                </div>
                <p className="text-sm font-black uppercase tracking-[0.3em] animate-pulse">Consulting the archives...</p>
            </div>
        ) : filteredQuestions.length === 0 ? (
            <div className="bg-bg-surface p-20 rounded-[3rem] border border-dashed border-border-main text-center flex flex-col items-center transition-all shadow-sm">
                <div className="bg-bg-main p-8 rounded-full mb-8 border border-border-main group-hover:scale-110 transition-transform">
                    <Search size={64} className="text-text-muted opacity-20" />
                </div>
                <h3 className="text-3xl font-black text-text-main mb-3 tracking-tighter">Zero results found</h3>
                <p className="text-text-muted max-w-sm mx-auto mb-10 font-medium leading-relaxed">
                    The archives are empty for these criteria. Try broadening your search or resetting the filters below.
                </p>
                <button 
                    onClick={() => { setSearchTerm(''); setSelectedTags([]); setSelectedYears([]); setSelectedTypes([]); setSelectedDifficulties([]); }}
                    className="px-8 py-3 bg-primary text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 hover:bg-primary-hover active:scale-95 transition-all"
                >
                    Reset All Filters
                </button>
            </div>
        ) : (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
                {viewMode === 'list' && <ListView />}
                {viewMode === 'card' && <CardView />}
                {viewMode === 'group' && <GroupView />}
            </div>
        )}
      </div>

      {showModal && (
        <AddQuestionModal 
            courseId={courseId} 
            onClose={() => setShowModal(false)} 
            onQuestionAdded={() => { loadQuestions(); setShowModal(false); }}
        />
      )}
    </div>
  );
}
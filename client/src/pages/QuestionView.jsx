import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Eye, EyeOff, Plus, FileText, Link as LinkIcon, 
  Edit, Trash2, Tag, Calendar, Download, Share2, Check,
  Maximize2, Layout, BookOpen, Clock, AlertTriangle, ChevronRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getQuestion, addSolution, updateSolution, deleteSolution, deleteQuestion, addPage, updatePage, deletePage, isReadOnly, getImageUrl } from '../api';
import EditQuestionModal from '../components/EditQuestionModal';
import FileUploader from '../components/FileUploader';
import GalleryUploader from '../components/GalleryUploader';

export default function QuestionView() {
  const readOnly = isReadOnly();
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSolution, setShowSolution] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(false);

  // Question Pages State
  const [isAddingPage, setIsAddingPage] = useState(false);
  const [newPageContent, setNewPageContent] = useState('');
  const [newPageImage, setNewPageImage] = useState(null);
  const [editingPageId, setEditingPageId] = useState(null);
  const [editPageContent, setEditPageContent] = useState('');
  const [editPageImage, setEditPageImage] = useState(null);

  // Solution State
  const [isAddingSolution, setIsAddingSolution] = useState(false);
  const [solutionContent, setSolutionContent] = useState('');
  const [solutionTitle, setSolutionTitle] = useState('');
  const [solutionImages, setSolutionImages] = useState([]);
  const [activeSolutionIdx, setActiveSolutionIdx] = useState(0);
  const [editingSolutionId, setEditingSolutionId] = useState(null);
  const [editSolContent, setEditSolContent] = useState('');
  const [editSolTitle, setEditSolTitle] = useState('');
  const [editSolImage, setEditSolImage] = useState(null);
  
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    loadQuestion();
  }, [id]);

  const loadQuestion = async () => {
    try {
      const data = await getQuestion(id);
      
      // Group solutions by group_id
      const groupedSolutions = [];
      const groups = {};
      
      if (data.solutions) {
          // Ensure they are sorted by page_order first
          const sortedSols = [...data.solutions].sort((a, b) => (a.page_order || 0) - (b.page_order || 0));
          
          sortedSols.forEach(sol => {
              const gid = sol.group_id || `legacy-${sol.id}`;
              if (!groups[gid]) {
                  groups[gid] = {
                      id: gid,
                      title: sol.title,
                      parts: []
                  };
                  groupedSolutions.push(groups[gid]);
              }
              groups[gid].parts.push(sol);
          });
      }
      
      setQuestion({ ...data, groupedSolutions });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  const handleDeleteQuestion = async () => {
    if (confirm('Are you sure you want to delete this question? This cannot be undone.')) {
      try {
        await deleteQuestion(id);
        navigate(`/courses/${question.course_id}`);
      } catch (err) {
        alert('Failed to delete question');
      }
    }
  };

  const handleAddPage = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('content', newPageContent);
    if (newPageImage) formData.append('image', newPageImage);

    try {
      await addPage(id, formData);
      setIsAddingPage(false);
      setNewPageContent('');
      setNewPageImage(null);
      loadQuestion();
    } catch (err) {
      alert('Failed to add page');
    }
  };

  const startEditPage = (page) => {
    setEditingPageId(page.id);
    setEditPageContent(page.content || '');
    setEditPageImage(null);
  };

  const handleUpdatePage = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('content', editPageContent);
    if (editPageImage) formData.append('image', editPageImage);

    try {
      await updatePage(editingPageId, formData);
      setEditingPageId(null);
      loadQuestion();
    } catch (err) {
      alert('Failed to update page');
    }
  };

  const handleDeletePage = async (pageId) => {
    if (confirm('Delete this part of the question?')) {
      try {
        await deletePage(pageId);
        loadQuestion();
      } catch (err) {
        alert('Failed to delete page');
      }
    }
  };

  const handleAddSolution = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('content', solutionContent);
    formData.append('title', solutionTitle);
    
    if (solutionImages.length > 0) {
        solutionImages.forEach(img => {
            formData.append('images', img);
        });
    }

    try {
      await addSolution(id, formData);
      setIsAddingSolution(false);
      setSolutionContent('');
      setSolutionTitle('');
      setSolutionImages([]);
      loadQuestion();
    } catch (err) {
      alert('Failed to add solution');
    }
  };

  const startEditSolution = (sol) => {
    setEditingSolutionId(sol.id);
    setEditSolContent(sol.content || '');
    setEditSolTitle(sol.title || '');
    setEditSolImage(null);
  };

  const handleUpdateSolution = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('content', editSolContent);
    formData.append('title', editSolTitle);
    if (editSolImage) formData.append('image', editSolImage);

    try {
      await updateSolution(editingSolutionId, formData);
      setEditingSolutionId(null);
      loadQuestion();
    } catch (err) {
      alert('Failed to update solution');
    }
  };

  const handleDeleteSolution = async (solId) => {
    if (confirm('Delete this solution page?')) {
      try {
        await deleteSolution(solId);
        loadQuestion();
      } catch (err) {
        alert('Failed to delete solution');
      }
    }
  };

  const DifficultyBadge = ({ level }) => {
    const configs = {
        0: { label: 'Undefined', color: 'bg-gray-100 text-gray-600' },
        1: { label: 'Easy', color: 'bg-green-100 text-green-700 border-green-200' },
        3: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
        5: { label: 'Hard', color: 'bg-red-100 text-red-700 border-red-200' }
    };
    const config = configs[level] || configs[0];
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter border ${config.color}`}>
            {config.label}
        </span>
    );
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 text-text-muted gap-6">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen size={20} className="text-primary animate-pulse" />
            </div>
        </div>
        <p className="text-sm font-black uppercase tracking-[0.3em] animate-pulse">Consulting the archives...</p>
    </div>
  );

  if (!question) return <div className="p-8 text-center text-red-500 font-bold">Question not found</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      {/* Header / Nav */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
            <Link to={`/courses/${question.course_id}`} className="hover:text-primary transition-colors flex items-center gap-1">
              <ChevronLeft size={12} /> Course
            </Link>
            <span className="opacity-30">/</span>
            <span className="truncate max-w-[200px]">{question.title}</span>
          </div>
          <h1 className="text-3xl font-black text-text-main tracking-tight mt-1 leading-none">{question.title}</h1>
        </div>
        
        <div className="flex items-center gap-2">
            <button 
                onClick={copyToClipboard}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all border border-border-main shadow-sm ${copying ? 'bg-green-500 text-white border-green-500' : 'bg-bg-surface text-text-main hover:bg-bg-main'}`}
            >
                {copying ? <Check size={14} /> : <Share2 size={14} />}
                {copying ? 'Copied' : 'Share'}
            </button>
            {!readOnly && (
                <>
                    <button 
                        onClick={() => setEditingQuestion(true)}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-primary bg-accent hover:bg-primary/10 rounded-xl transition-all border border-primary/10 shadow-sm"
                    >
                        <Edit size={14} /> Edit
                    </button>
                    <button 
                        onClick={handleDeleteQuestion}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-red-500 bg-red-500/5 hover:bg-red-500/10 rounded-xl transition-all border border-red-500/10"
                    >
                        <Trash2 size={14} /> Delete
                    </button>
                </>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content: Question & Solution (3 Cols) */}
        <div className="lg:col-span-3 space-y-12">
            
            {/* Question Pages Container */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border-main pb-2">
                    <h2 className="text-xl font-black text-text-main uppercase tracking-tight">Question</h2>
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{question.pages?.length || 0} Parts</span>
                </div>
                
                <div className="bg-bg-surface border border-border-main rounded-[2rem] overflow-hidden shadow-sm divide-y divide-border-main">
                    {question.pages && question.pages.length > 0 ? (
                        question.pages.map((page, index) => (
                            <div key={page.id || index} className="group relative p-8">
                                {/* Page Actions */}
                                {!readOnly && (
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                                        {page.id !== 'legacy' && (
                                            <>
                                                <button onClick={() => startEditPage(page)} className="p-2 bg-bg-surface/90 backdrop-blur-sm text-text-muted rounded-xl shadow-sm hover:text-primary border border-border-main">
                                                    <Edit size={14} />
                                                </button>
                                                <button onClick={() => handleDeletePage(page.id)} className="p-2 bg-bg-surface/90 backdrop-blur-sm text-text-muted rounded-xl shadow-sm hover:text-red-500 border border-border-main">
                                                    <Trash2 size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}

                                {editingPageId === page.id ? (
                                    <form onSubmit={handleUpdatePage} className="bg-bg-main p-6 rounded-2xl space-y-4 border border-border-main">
                                        <textarea 
                                            className="w-full p-4 bg-bg-surface border border-border-main rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none text-text-main font-medium" 
                                            value={editPageContent} 
                                            onChange={e => setEditPageContent(e.target.value)}
                                            rows={4}
                                        />
                                        <FileUploader 
                                            onFileSelect={setEditPageImage}
                                            previewUrl={page.image_path ? getImageUrl(page.image_path) : null}
                                            label="Replace Image"
                                            className="bg-bg-surface p-4 rounded-xl border border-border-main border-dashed"
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <button type="button" onClick={() => setEditingPageId(null)} className="px-4 py-2 text-xs font-bold text-text-muted hover:bg-bg-surface rounded-lg">Cancel</button>
                                            <button type="submit" className="px-6 py-2 text-xs font-black uppercase tracking-widest bg-primary text-white rounded-lg shadow-lg shadow-primary/20">Save</button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="space-y-6">
                                        {page.image_path && (
                                            <div className="flex justify-center bg-bg-main rounded-2xl p-4 border border-border-main/50 relative overflow-hidden group/img">
                                                <img 
                                                    src={getImageUrl(page.image_path)} 
                                                    alt={`Part ${index + 1}`} 
                                                    className="max-w-full max-h-[800px] object-contain rounded-xl shadow-lg relative z-10 transition-transform duration-500 group-hover/img:scale-[1.02]"
                                                />
                                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/img:opacity-100 transition-opacity"></div>
                                            </div>
                                        )}
                                        {page.content && (
                                            <div className="prose prose-lg dark:prose-invert text-text-main max-w-none font-medium leading-relaxed px-2">
                                                <ReactMarkdown>{page.content}</ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center text-text-muted">
                            <p className="font-bold opacity-40">No content added yet.</p>
                        </div>
                    )}
                </div>

                {/* Add Page Button */}
                {!isAddingPage && !readOnly && (
                    <button 
                        onClick={() => setIsAddingPage(true)}
                        className="w-full py-4 border-2 border-dashed border-border-main rounded-[2rem] text-text-muted hover:border-primary hover:text-primary hover:bg-accent transition-all flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px]"
                    >
                        <Plus size={16} strokeWidth={3} /> 
                        Add Question Part
                    </button>
                )}

                {/* Add Page Form */}
                {isAddingPage && (
                    <div className="bg-bg-surface p-8 rounded-[2rem] shadow-sm border border-border-main animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-2 mb-6">
                            <Plus size={16} className="text-primary" />
                            <h3 className="font-black text-text-main uppercase tracking-widest text-xs">New Question Part</h3>
                        </div>
                        <form onSubmit={handleAddPage} className="space-y-6">
                            <textarea 
                                className="w-full px-5 py-4 bg-bg-main border border-border-main rounded-2xl focus:ring-2 focus:ring-primary focus:bg-bg-surface outline-none h-32 text-text-main font-medium"
                                placeholder="Type question text here (Markdown supported)..."
                                value={newPageContent}
                                onChange={(e) => setNewPageContent(e.target.value)}
                            />
                            <FileUploader 
                                onFileSelect={setNewPageImage}
                                label="Upload Image (Drag & Drop or Paste)"
                                className="bg-bg-main p-6 rounded-2xl border border-border-main border-dashed"
                            />
                            <div className="flex justify-end gap-3 pt-2">
                                <button 
                                    type="button" 
                                    onClick={() => setIsAddingPage(false)}
                                    className="px-6 py-2.5 text-text-muted hover:bg-bg-main rounded-xl text-xs font-bold transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-8 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-hover text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all"
                                >
                                    Add Part
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>


            {/* Solution Section (Spoiler) */}
            <div className="relative">
                {!showSolution ? (
                <button 
                    onClick={() => setShowSolution(true)}
                    className="w-full py-20 bg-gradient-to-br from-bg-surface to-bg-main rounded-[2rem] border-2 border-dashed border-border-main flex flex-col items-center justify-center gap-4 hover:border-primary transition-all group shadow-sm overflow-hidden relative"
                >
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="bg-bg-surface p-5 rounded-full shadow-xl border border-border-main group-hover:scale-110 transition-transform relative z-10">
                        <EyeOff size={40} className="text-primary" />
                    </div>
                    <div className="relative z-10 text-center">
                        <span className="text-xl font-black text-text-main tracking-tight block">Reveal Solution</span>
                        <span className="text-xs font-bold text-text-muted uppercase tracking-widest mt-1">Tap to verify your knowledge</span>
                    </div>
                </button>
                ) : (
                <div className="bg-bg-surface rounded-[2rem] border border-green-500/20 overflow-hidden shadow-xl animate-in fade-in slide-in-from-top-8 duration-500">
                    <div className="p-5 bg-green-500/10 border-b border-green-500/10 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-500 p-1.5 rounded-lg text-white">
                                <Check size={16} strokeWidth={3} />
                            </div>
                            <h3 className="font-black text-green-700 text-xs uppercase tracking-[0.2em]">Solution Vault</h3>
                        </div>
                        <button 
                            onClick={() => setShowSolution(false)}
                            className="text-xs font-black text-green-700 hover:bg-green-500/10 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all"
                        >
                            <Eye size={14} /> Hide
                        </button>
                    </div>

                    <div className="p-6 space-y-8">
                    {question.groupedSolutions && question.groupedSolutions.length > 0 ? (
                        <div className="space-y-8">
                            {/* Solution Tabs */}
                            <div className="flex flex-wrap gap-2 bg-bg-main p-1.5 rounded-2xl border border-border-main w-fit">
                                {question.groupedSolutions.map((group, idx) => (
                                    <button
                                        key={group.id}
                                        onClick={() => setActiveSolutionIdx(idx)}
                                        className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                            activeSolutionIdx === idx 
                                            ? 'bg-bg-surface text-green-600 shadow-md border border-green-500/20' 
                                            : 'text-text-muted hover:text-text-main'
                                        }`}
                                    >
                                        {group.title || `Method ${idx + 1}`}
                                    </button>
                                ))}
                            </div>

                            {/* Active Solution Content */}
                            {question.groupedSolutions[activeSolutionIdx] && (
                                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                                    <div className="bg-bg-surface rounded-[1.5rem] border border-border-main overflow-hidden shadow-sm divide-y divide-border-main">
                                        {question.groupedSolutions[activeSolutionIdx].parts.map((part, pIdx) => (
                                            <div key={part.id} className="relative group/sol p-8">
                                                {/* Page Actions */}
                                                {!readOnly && (
                                                    <div className="absolute top-4 right-4 opacity-0 group-hover/sol:opacity-100 transition-opacity flex gap-2 z-10">
                                                        <button onClick={() => startEditSolution(part)} className="p-2 bg-bg-surface/90 backdrop-blur-sm text-text-muted rounded-xl shadow-sm hover:text-primary border border-border-main">
                                                            <Edit size={14} />
                                                        </button>
                                                        <button onClick={() => handleDeleteSolution(part.id)} className="p-2 bg-bg-surface/90 backdrop-blur-sm text-text-muted rounded-xl shadow-sm hover:text-red-500 border border-border-main">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                )}

                                                <div className="space-y-6">
                                                    {part.image_path && (
                                                        <div className="flex justify-center bg-bg-main rounded-2xl p-4 border border-border-main/50 relative overflow-hidden group/img">
                                                            <img 
                                                                src={getImageUrl(part.image_path)} 
                                                                alt={`Part ${pIdx + 1}`} 
                                                                className="max-w-full max-h-[800px] object-contain rounded-xl shadow-lg relative z-10 transition-transform duration-500 group-hover/img:scale-[1.02]"
                                                            />
                                                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/img:opacity-100 transition-opacity"></div>
                                                        </div>
                                                    )}
                                                    {part.content && (
                                                        <div className="prose prose-lg dark:prose-invert text-text-main max-w-none font-medium leading-relaxed px-2">
                                                            <ReactMarkdown>{part.content}</ReactMarkdown>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-12 text-center text-text-muted">
                            <p className="font-bold italic opacity-40">No solution discovered yet.</p>
                        </div>
                    )}
                    
                    {/* Add New Solution Page Button */}
                    {!isAddingSolution && !readOnly && (
                        <div className="text-center pt-4">
                            <button 
                                onClick={() => setIsAddingSolution(true)}
                                className="inline-flex items-center gap-2 px-8 py-4 bg-bg-main text-green-700 rounded-[1.5rem] hover:bg-accent border border-border-main transition-all font-black uppercase tracking-widest text-[10px] shadow-sm active:scale-95"
                            >
                                <Plus size={16} strokeWidth={3} /> 
                                {question.groupedSolutions?.length > 0 ? 'Add Alternative Solution' : 'Add New Solution'}
                            </button>
                        </div>
                    )}

                    {/* Add Solution Form */}
                    {isAddingSolution && (
                        <div className="bg-bg-main p-8 rounded-[2rem] shadow-sm border border-border-main mt-4 animate-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-2 mb-6">
                                <Check size={16} className="text-green-500" />
                                <h3 className="font-black text-text-main uppercase tracking-widest text-xs">New Solution Set</h3>
                            </div>
                            <form onSubmit={handleAddSolution} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Solution Label (Optional)</label>
                                    <input 
                                        className="w-full px-5 py-3 bg-bg-surface border border-border-main rounded-xl focus:ring-2 focus:ring-primary outline-none text-text-main font-bold"
                                        placeholder="e.g. Method 1, Quick Shortcut..."
                                        value={solutionTitle}
                                        onChange={(e) => setSolutionTitle(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Detailed Explanation</label>
                                    <textarea 
                                        className="w-full px-5 py-4 bg-bg-surface border border-border-main rounded-2xl focus:ring-2 focus:ring-primary outline-none h-32 text-text-main font-medium"
                                        placeholder="Type the solution or explanation (Markdown supported)..."
                                        value={solutionContent}
                                        onChange={(e) => setSolutionContent(e.target.value)}
                                    />
                                </div>
                                <GalleryUploader 
                                    files={solutionImages}
                                    onFilesChange={setSolutionImages}
                                    label="Solution Images"
                                    className="bg-bg-surface p-6 rounded-2xl border border-border-main border-dashed"
                                />
                                <div className="flex justify-end gap-3 pt-2">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsAddingSolution(false)}
                                        className="px-6 py-2.5 text-text-muted hover:bg-bg-surface rounded-xl text-xs font-bold transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="px-8 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 text-xs font-black uppercase tracking-widest shadow-xl shadow-green-200 transition-all"
                                    >
                                        Save Solution
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
            )}
        </div>
    </div>

        {/* Right Sidebar: Tags & References (1 Col) */}
        <div className="space-y-6">
             {/* Info Card */}
             <div className="bg-bg-surface p-6 rounded-[2rem] shadow-sm border border-border-main animate-in slide-in-from-right duration-500">
                <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <Layout size={12} className="text-primary" /> Intelligence
                </h3>
                
                <div className="space-y-6">
                    {/* Year */}
                    <div className="group/meta">
                        <span className="text-[10px] font-black text-text-muted/50 uppercase tracking-widest flex items-center gap-2 mb-2">
                            <Calendar size={12} /> Year
                        </span>
                        {question.year ? (
                            <Link to={`/courses/${question.course_id}?search=${question.year}`} className="text-sm font-black text-text-main hover:text-primary transition-colors flex items-center justify-between">
                                {question.year}
                                <ChevronRight size={14} className="opacity-0 group-hover/meta:opacity-100 transition-all" />
                            </Link>
                        ) : (
                            <span className="text-sm text-text-muted opacity-30 italic font-medium">Not specified</span>
                        )}
                    </div>

                    {/* Type */}
                    <div className="group/meta">
                        <span className="text-[10px] font-black text-text-muted/50 uppercase tracking-widest flex items-center gap-2 mb-2">
                            <BookOpen size={12} /> Category
                        </span>
                        {question.type ? (
                            <Link to={`/courses/${question.course_id}?search=${question.type}`} className="inline-block text-xs font-black text-primary bg-accent px-3 py-1 rounded-lg uppercase tracking-tighter border border-primary/10">
                                {question.type}
                            </Link>
                        ) : (
                            <span className="text-sm text-text-muted opacity-30 italic font-medium">Generic</span>
                        )}
                    </div>

                    {/* Difficulty */}
                    <div>
                        <span className="text-[10px] font-black text-text-muted/50 uppercase tracking-widest flex items-center gap-2 mb-2">
                            <AlertTriangle size={12} /> Intensity
                        </span>
                        <DifficultyBadge level={question.difficulty} />
                    </div>

                    {/* Tags */}
                    <div className="pt-2 border-t border-border-main">
                         <span className="text-[10px] font-black text-text-muted/50 uppercase tracking-widest flex items-center gap-2 mb-4">
                            <Tag size={12} /> Identifiers
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {question.tags && question.tags.length > 0 ? (
                                question.tags.map(t => (
                                    <Link key={t.id} to={`/courses/${question.course_id}?search=${t.name}`} className="text-[10px] font-black px-3 py-1.5 bg-bg-main text-text-main rounded-xl border border-border-main hover:border-primary hover:text-primary transition-all uppercase tracking-tighter">
                                        #{t.name}
                                    </Link>
                                ))
                            ) : (
                                <span className="text-xs text-text-muted opacity-20 font-bold italic">No tags assigned</span>
                            )}
                        </div>
                    </div>
                </div>
             </div>

             {/* References Card */}
             <div className="bg-bg-surface p-6 rounded-[2rem] shadow-sm border border-border-main animate-in slide-in-from-right duration-700">
                <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <LinkIcon size={12} className="text-primary" /> Sources
                </h3>
                <div className="text-sm text-text-main leading-relaxed prose prose-sm dark:prose-invert max-w-none font-medium">
                    <ReactMarkdown>{question.references_text || 'No external sources linked.'}</ReactMarkdown>
                </div>
             </div>
        </div>
      </div>

      {editingQuestion && (
        <EditQuestionModal 
            question={question}
            onClose={() => setEditingQuestion(false)}
            onQuestionUpdated={() => { loadQuestion(); setEditingQuestion(false); }}
        />
      )}
    </div>
  );
}
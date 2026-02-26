import React, { useState, useEffect } from 'react';
import { X, FileText, Link as LinkIcon, Tag, AlertCircle } from 'lucide-react';
import { createQuestion, getTags } from '../api';
import GalleryUploader from './GalleryUploader';

export default function AddQuestionModal({ courseId, onClose, onQuestionAdded }) {
  const [title, setTitle] = useState('');
  const [images, setImages] = useState([]);
  const [notes, setNotes] = useState('');
  const [references, setReferences] = useState('');
  const [tags, setTags] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [questionNumber, setQuestionNumber] = useState('');
  const [difficulty, setDifficulty] = useState(0); 
  const [type, setType] = useState('Semester');
  const [customType, setCustomType] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getTags().then(setAvailableTags).catch(err => console.error("Failed to load tags", err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation: Title, Year, Tags are mandatory.
    if (!title.trim()) {
        setError('Title is required.');
        return;
    }
    if (!year) {
        setError('Year is required.');
        return;
    }
    if (!tags.trim()) {
        setError('At least one tag is required.');
        return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('course_id', courseId);
    formData.append('title', title);
    
    // Append images
    if (images.length > 0) {
        images.forEach(img => {
            formData.append('images', img);
        });
    }

    formData.append('notes', notes);
    formData.append('references_text', references);
    formData.append('year', year);
    formData.append('question_number', questionNumber);
    formData.append('difficulty', difficulty);
    formData.append('type', type === 'Other' ? customType : type);
    
    const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
    formData.append('tags', JSON.stringify(tagArray));

    try {
      await createQuestion(formData);
      onQuestionAdded();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to add question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-bg-surface rounded-[2.5rem] shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto relative flex flex-col border border-border-main">
        {/* Header */}
        <div className="p-8 border-b border-border-main flex justify-between items-start bg-bg-surface/80 backdrop-blur-md sticky top-0 z-10">
            <div>
                <h2 className="text-2xl font-black text-text-main tracking-tighter uppercase">Add Question</h2>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-1">Populate the academic archives</p>
            </div>
            <button 
                onClick={onClose}
                className="text-text-muted hover:text-text-main p-2 bg-bg-main rounded-xl transition-all"
            >
                <X size={20} />
            </button>
        </div>

        {/* Error Message */}
        {error && (
            <div className="mx-8 mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center gap-3 text-xs font-bold uppercase tracking-widest animate-in slide-in-from-top-2">
                <AlertCircle size={18} />
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {/* Title & Year & Difficulty */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            <div className="md:col-span-3">
              <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                required
                className="w-full px-5 py-3 bg-bg-main border border-border-main rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-bold text-text-main"
                placeholder="e.g. 2023 Midterm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">
                Number
              </label>
              <input 
                type="number" 
                className="w-full px-5 py-3 bg-bg-main border border-border-main rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-bold text-text-main"
                placeholder="Q#"
                value={questionNumber}
                onChange={(e) => setQuestionNumber(e.target.value)}
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">
                Year <span className="text-red-500">*</span>
              </label>
              <input 
                type="number" 
                required
                className="w-full px-5 py-3 bg-bg-main border border-border-main rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-bold text-text-main"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">
                Difficulty
              </label>
              <select 
                className="w-full px-5 py-3 bg-bg-main border border-border-main rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-bold text-text-main appearance-none"
                value={difficulty}
                onChange={(e) => setDifficulty(parseInt(e.target.value))}
              >
                <option value={0}>-</option>
                <option value={1}>Easy</option>
                <option value={3}>Medium</option>
                <option value={5}>Hard</option>
              </select>
            </div>
          </div>

          {/* Gallery Uploader */}
          <div className="bg-bg-main p-6 rounded-[2rem] border border-border-main border-dashed">
            <GalleryUploader 
                files={images} 
                onFilesChange={setImages} 
                label="Question Content (Images)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">
                Question Type
              </label>
              <div className="space-y-2">
                <select 
                  className="w-full px-5 py-3 bg-bg-main border border-border-main rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-bold text-text-main appearance-none"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="Semester">Semester (Final)</option>
                  <option value="Midterm">Midterm</option>
                  <option value="Class Test">Class Test</option>
                  <option value="Quiz">Quiz</option>
                  <option value="Assignment">Assignment</option>
                  <option value="Book Question">Book Question</option>
                  <option value="Other">Other (Custom)</option>
                </select>
                {type === 'Other' && (
                  <input 
                    type="text"
                    className="w-full px-5 py-3 bg-bg-surface border border-primary/30 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-bold text-text-main animate-in slide-in-from-top-2"
                    placeholder="Enter custom type..."
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    autoFocus
                  />
                )}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 flex items-center gap-2">
                <Tag size={12} /> Identifiers <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                required
                className="w-full px-5 py-3 bg-bg-main border border-border-main rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-bold text-text-main"
                placeholder="e.g. Calculus, Integration"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {availableTags.slice(0, 8).map(t => (
                  <button 
                    type="button" 
                    key={t.id} 
                    onClick={() => setTags(prev => {
                        const existing = prev.split(',').map(x => x.trim());
                        if(existing.includes(t.name)) return prev;
                        return prev ? `${prev}, ${t.name}` : t.name;
                    })}
                    className="text-[9px] font-black bg-bg-surface text-text-muted px-3 py-1 rounded-lg hover:bg-primary hover:text-white border border-border-main transition-all uppercase tracking-tighter"
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border-main">
            <div>
              <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 flex items-center gap-2">
                <FileText size={12} /> Notes (Optional)
              </label>
              <textarea 
                className="w-full px-5 py-4 bg-bg-main border border-border-main rounded-2xl focus:ring-2 focus:ring-primary outline-none h-32 text-sm font-medium text-text-main"
                placeholder="Key concepts, hints..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 flex items-center gap-2">
                <LinkIcon size={12} /> References (Optional)
              </label>
              <textarea 
                className="w-full px-5 py-4 bg-bg-main border border-border-main rounded-2xl focus:ring-2 focus:ring-primary outline-none h-32 text-sm font-medium text-text-main"
                placeholder="Textbook pg 42, Links..."
                value={references}
                onChange={(e) => setReferences(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-border-main sticky bottom-0 bg-bg-surface pb-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-8 py-3 text-text-muted hover:bg-bg-main rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-10 py-3 bg-primary text-white rounded-2xl hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all font-black uppercase tracking-widest text-xs disabled:opacity-50 active:scale-95"
            >
              {loading ? 'Processing...' : 'Deploy Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
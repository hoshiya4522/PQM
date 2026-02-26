import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Layers, Menu, X, Edit2, GripVertical, Settings, Check } from 'lucide-react';
import { getCourses, createCourse, reorderCourses, isReadOnly } from '../api';
import EditCourseModal from './EditCourseModal';

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [newCourse, setNewCourse] = useState({ code: '', title: '' });

  const readOnly = isReadOnly();

  React.useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await getCourses();
      setCourses(data);
    } catch (err) {
      console.error("Failed to load courses", err);
    }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    if (!newCourse.code || !newCourse.title) return;
    try {
      const created = await createCourse(newCourse);
      setNewCourse({ code: '', title: '' });
      setIsAdding(false);
      await loadCourses();
      navigate(`/courses/${created.id}`);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReorder = async (draggedId, targetId) => {
    const newCourses = [...courses];
    const draggedIdx = newCourses.findIndex(c => c.id === draggedId);
    const targetIdx = newCourses.findIndex(c => c.id === targetId);
    
    const [removed] = newCourses.splice(draggedIdx, 1);
    newCourses.splice(targetIdx, 0, removed);
    
    setCourses(newCourses);
  };

  const saveOrder = async () => {
    const orders = courses.map((c, index) => ({ id: c.id, sort_order: index }));
    try {
        await reorderCourses(orders);
        setIsEditMode(false);
    } catch (err) {
        console.error(err);
        alert("Failed to save order");
    }
  };

  const onDragStart = (e, id) => {
    e.dataTransfer.setData("id", id);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = (e, targetId) => {
    const draggedId = parseInt(e.dataTransfer.getData("id"));
    if (draggedId === targetId) return;
    handleReorder(draggedId, targetId);
  };

  // Mobile classes vs Desktop classes
  const sidebarClasses = `
    fixed top-0 left-0 h-full bg-bg-sidebar text-text-sidebar shadow-xl z-50 transition-transform duration-300 ease-in-out
    w-64 flex flex-col border-r border-border-main
    ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
  `;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <div className={sidebarClasses}>
        <div className="p-6 border-b border-border-main flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="text-primary" size={24} />
            <Link to="/" className="text-xl font-black tracking-tighter hover:text-primary transition-colors text-text-sidebar" onClick={onClose}>
              QuestionBank
            </Link>
          </div>
          {/* Mobile Close Button */}
          <button onClick={onClose} className="md:hidden text-text-muted hover:text-text-sidebar">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="flex justify-between items-center mb-2 px-2">
            <div className="text-[10px] font-black text-text-sidebar/50 uppercase tracking-[0.2em]">
              Library
            </div>
            {!isAdding && !readOnly && (
                <button 
                    onClick={() => setIsEditMode(!isEditMode)} 
                    className={`text-xs p-1 rounded transition-colors ${isEditMode ? 'bg-primary text-white' : 'text-text-sidebar/50 hover:text-text-sidebar hover:bg-sidebar-accent'}`}
                    title="Edit/Reorder Courses"
                >
                    {isEditMode ? <Check size={14} /> : <Settings size={14} />}
                </button>
            )}
          </div>
          
          <div className="space-y-1">
            {courses.map(course => (
                <div 
                    key={course.id}
                    draggable={isEditMode}
                    onDragStart={(e) => onDragStart(e, course.id)}
                    onDragOver={onDragOver}
                    onDrop={(e) => onDrop(e, course.id)}
                    className="group flex items-center gap-1"
                >
                    {isEditMode && (
                        <div className="cursor-grab text-text-muted hover:text-text-sidebar p-1">
                            <GripVertical size={14} />
                        </div>
                    )}
                    <NavLink 
                        to={`/courses/${course.id}`}
                        onClick={isEditMode ? (e) => e.preventDefault() : onClose}
                        className={({ isActive }) => 
                            `flex-1 flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-all ${
                            isActive && !isEditMode ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-sidebar-accent text-text-sidebar/70 hover:text-text-sidebar'
                            } ${isEditMode ? 'pointer-events-none opacity-80' : ''}`
                        }
                    >
                        <div className="flex items-start gap-3">
                            <BookOpen size={16} className="mt-1 flex-shrink-0" />
                            <span className="text-sm font-bold leading-tight">{course.code} - {course.title}</span>
                        </div>
                    </NavLink>
                    {isEditMode && (
                        <button 
                            onClick={() => setEditingCourse(course)}
                            className="p-2 text-text-muted hover:text-primary transition-colors"
                        >
                            <Edit2 size={14} />
                        </button>
                    )}
                </div>
            ))}
          </div>

          {isAdding ? (
            <form onSubmit={handleAddCourse} className="mt-4 bg-accent p-3 rounded-xl border border-border-main">
              <input 
                className="w-full bg-bg-surface text-text-main text-sm p-2 mb-2 rounded-lg outline-none border border-border-main focus:ring-1 focus:ring-primary" 
                placeholder="Code (e.g. CS101)" 
                value={newCourse.code}
                onChange={e => setNewCourse({...newCourse, code: e.target.value})}
                autoFocus
              />
              <input 
                className="w-full bg-bg-surface text-text-main text-sm p-2 mb-2 rounded-lg outline-none border border-border-main focus:ring-1 focus:ring-primary" 
                placeholder="Title" 
                value={newCourse.title}
                onChange={e => setNewCourse({...newCourse, title: e.target.value})}
              />
              <div className="flex gap-2 justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-text-muted hover:text-text-sidebar px-2 py-1"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="text-xs bg-primary px-3 py-1 rounded-lg text-white hover:bg-primary-hover font-black"
                >
                  Add
                </button>
              </div>
            </form>
          ) : !isEditMode && !readOnly && (
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-3 py-2 text-text-sidebar/70 hover:text-text-sidebar hover:bg-sidebar-accent w-full rounded-lg transition-all mt-2 text-sm font-bold"
            >
              <Plus size={16} />
              <span>Add Course</span>
            </button>
          )}
        </div>

        {isEditMode && (
            <div className="p-4 bg-accent border-t border-border-main">
                <button 
                    onClick={saveOrder}
                    className="w-full py-2 bg-primary hover:bg-primary-hover text-white text-xs font-black rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                    <Check size={14} /> Save Changes
                </button>
            </div>
        )}
      </div>

      {editingCourse && (
        <EditCourseModal 
            course={editingCourse}
            onClose={() => setEditingCourse(null)}
            onCourseUpdated={() => { loadCourses(); setEditingCourse(null); }}
            onCourseDeleted={() => { loadCourses(); setEditingCourse(null); navigate('/'); }}
        />
      )}
    </>
  );
}
import React, { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { updateCourse, deleteCourse } from '../api';

export default function EditCourseModal({ course, onClose, onCourseUpdated, onCourseDeleted }) {
  const [code, setCode] = useState(course.code);
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description || '');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateCourse(course.id, { code, title, description });
      onCourseUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to update course');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteCourse(course.id);
      onCourseDeleted();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to delete course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Edit Course</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
            </button>
        </div>

        {!showDeleteConfirm ? (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
                    <input 
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
                    <input 
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea 
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    />
                </div>
                <div className="flex justify-between pt-4">
                    <button 
                        type="button" 
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                        <Trash2 size={16} /> Delete Course
                    </button>
                    <div className="flex gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Save Changes</button>
                    </div>
                </div>
            </form>
        ) : (
            <div className="p-6 space-y-4 text-center">
                <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-red-600">
                    <AlertTriangle size={32} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Are you absolutely sure?</h3>
                    <p className="text-sm text-gray-500 mt-2">
                        This will permanently delete the course <strong>{course.code}</strong> and all associated questions and solutions. This action cannot be undone.
                    </p>
                </div>
                <div className="flex flex-col gap-2 pt-4">
                    <button 
                        onClick={handleDelete}
                        disabled={loading}
                        className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold disabled:opacity-50"
                    >
                        Yes, Delete Everything
                    </button>
                    <button 
                        onClick={() => setShowDeleteConfirm(false)}
                        className="w-full py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        No, Keep Course
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Plus, Image as ImageIcon, Trash2, Maximize2, FileText } from 'lucide-react';

export default function GalleryUploader({ 
  files = [], 
  onFilesChange, 
  allowPaste = true,
  label = "Images (Drag & Drop, Paste, or Click '+')"
}) {
  const [previews, setPreviews] = useState([]);
  const [enlargedIndex, setEnlargedIndex] = useState(null);
  const inputRef = useRef(null);

  // Sync previews with files prop
  useEffect(() => {
    if (!files || files.length === 0) {
      setPreviews([]);
      return;
    }

    const newPreviews = files.map(file => {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
      }
      return null; // For non-images
    });

    setPreviews(newPreviews);

    // Cleanup URLs to avoid memory leaks
    return () => {
      newPreviews.forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [files]);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
    // Reset input so same file can be selected again if needed
    if (inputRef.current) inputRef.current.value = '';
  };

  const addFiles = (newFiles) => {
    const combined = [...files, ...newFiles];
    onFilesChange(combined);
  };

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
    if (enlargedIndex === index) setEnlargedIndex(null);
  };

  // Paste Support
  useEffect(() => {
    if (!allowPaste) return;

    const handlePaste = (e) => {
      if (e.clipboardData.files && e.clipboardData.files.length > 0) {
        e.preventDefault();
        addFiles(Array.from(e.clipboardData.files));
      }
    };

    // Listen on window/document for better UX (paste anywhere when modal is focused)
    // Or just bind to a container. Let's bind to document for now if this component is mounted.
    // Actually, only if the user is interacting with this component?
    // Let's stick to container binding to avoid global conflicts, but make container focusable.
  }, [files]);

  const onContainerPaste = (e) => {
    if (!allowPaste) return;
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      addFiles(Array.from(e.clipboardData.files));
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div 
      className="space-y-4 outline-none" 
      onPaste={onContainerPaste} 
      tabIndex="0"
    >
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      {/* Gallery Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {/* Existing Files */}
        {files.map((file, index) => (
          <div key={index} className="relative group aspect-square bg-gray-100 rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {previews[index] ? (
              <img 
                src={previews[index]} 
                alt={`preview ${index}`} 
                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setEnlargedIndex(index)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-2 text-center">
                <FileText size={24} />
                <span className="text-xs truncate w-full mt-1">{file.name}</span>
              </div>
            )}
            
            {/* Remove Button */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeFile(index); }}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove image"
            >
              <X size={12} />
            </button>
            
            {/* Enlarge Button Hint */}
            {previews[index] && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/50 text-white p-2 rounded-full">
                        <Maximize2 size={16} />
                    </div>
                </div>
            )}
          </div>
        ))}

        {/* Add Button */}
        <div 
          onClick={() => inputRef.current?.click()}
          onDragOver={onDragOver}
          onDrop={onDrop}
          className="aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-blue-500 hover:text-blue-500 text-gray-400 transition-all group"
        >
          <input 
            ref={inputRef}
            type="file" 
            multiple 
            accept="image/*" 
            onChange={handleFileSelect} 
            className="hidden" 
          />
          <Plus size={32} className="group-hover:scale-110 transition-transform mb-1" />
          <span className="text-xs font-medium">Add Images</span>
        </div>
      </div>

      {/* Enlarged View Modal */}
      {enlargedIndex !== null && previews[enlargedIndex] && (
        <div 
            className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setEnlargedIndex(null)}
        >
            <button 
                className="absolute top-4 right-4 text-white hover:text-gray-300"
                onClick={() => setEnlargedIndex(null)}
            >
                <X size={32} />
            </button>
            <img 
                src={previews[enlargedIndex]} 
                alt="Enlarged" 
                className="max-w-full max-h-full rounded shadow-2xl"
                onClick={(e) => e.stopPropagation()} 
            />
            <div className="absolute bottom-4 left-0 right-0 text-center text-white/70 text-sm">
                Image {enlargedIndex + 1} of {files.length}
            </div>
        </div>
      )}
    </div>
  );
}

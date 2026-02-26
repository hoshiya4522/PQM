import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, FileText, Clipboard } from 'lucide-react';

export default function FileUploader({ 
  onFileSelect, 
  previewUrl, 
  label = "Upload File", 
  accept = "image/*,application/pdf", 
  allowPaste = true,
  multiple = false,
  className = "" 
}) {
  const [dragActive, setDragActive] = useState(false);
  const [previews, setPreviews] = useState(previewUrl ? [previewUrl] : []);
  const [fileNames, setFileNames] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (previewUrl) setPreviews([previewUrl]);
    else setPreviews([]);
  }, [previewUrl]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handlePasteClick = async () => {
    try {
        const items = await navigator.clipboard.read();
        const files = [];
        for (const item of items) {
            if (item.types.some(type => type.startsWith('image/'))) {
                const blob = await item.getType(item.types.find(type => type.startsWith('image/')));
                files.push(new File([blob], "pasted-image.png", { type: blob.type }));
            }
        }
        if (files.length > 0) {
             // Convert array to FileList-like object or just array
             handleFiles(files);
        } else {
            alert("No images found in clipboard.");
        }
    } catch (err) {
        // Fallback for browsers that don't support async clipboard read (firefox sometimes)
        // or prompt user to just Ctrl+V
        alert("Please click inside the box and press Ctrl+V to paste.");
    }
  };

  const onPaste = (e) => {
    if (!allowPaste) return;
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      handleFiles(e.clipboardData.files);
    }
  };

  const handleFiles = (files) => {
    const fileList = Array.from(files);
    
    // If not multiple, take the first one
    const filesToProcess = multiple ? fileList : [fileList[0]];

    const newPreviews = [];
    const newNames = [];

    filesToProcess.forEach(file => {
        if (file.type.startsWith('image/')) {
            newPreviews.push(URL.createObjectURL(file));
        } else {
            newPreviews.push(null);
        }
        newNames.push(file.name);
    });

    if (multiple) {
        // Append? Or replace? 
        // For this simple implementation, let's replace to keep state simple with parent
        setPreviews(newPreviews);
        setFileNames(newNames);
        onFileSelect(filesToProcess); // Return array
    } else {
        setPreviews(newPreviews);
        setFileNames(newNames);
        onFileSelect(filesToProcess[0]); // Return single file
    }
  };

  const clearFile = (e) => {
    e.stopPropagation();
    setPreviews([]);
    setFileNames([]);
    onFileSelect(multiple ? [] : null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-1">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {allowPaste && (
            <button 
                type="button" 
                onClick={handlePasteClick}
                className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700"
                title="Paste from clipboard"
            >
                <Clipboard size={12} /> Paste
            </button>
        )}
      </div>
      <div 
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer outline-none ${
          dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:bg-gray-50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onPaste={onPaste}
        onClick={() => inputRef.current?.click()}
        tabIndex="0"
      >
        <input 
          ref={inputRef}
          type="file" 
          accept={accept}
          onChange={handleChange}
          className="hidden"
          multiple={multiple}
        />

        {previews.length > 0 ? (
          <div className={`grid gap-4 ${multiple && previews.length > 1 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}>
            {previews.map((src, idx) => (
                <div key={idx} className="relative group">
                    {src ? (
                        <img src={src} alt="Preview" className="max-h-64 rounded shadow-sm object-contain mx-auto" />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-4">
                            <FileText size={48} className="text-gray-400 mb-2" />
                            <p className="text-sm font-medium text-gray-700 truncate max-w-full px-2">{fileNames[idx]}</p>
                        </div>
                    )}
                </div>
            ))}
            <button 
              type="button" 
              onClick={clearFile}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 hover:opacity-100 transition-opacity z-10"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="py-4 flex flex-col items-center justify-center text-gray-500">
            <Upload className="mb-2 text-gray-400" size={32} />
            <p className="text-sm font-medium">Click to browse or Drag & Drop</p>
            {multiple && <p className="text-xs text-gray-400 mt-1">Upload multiple images</p>}
          </div>
        )}
      </div>
    </div>
  );
}
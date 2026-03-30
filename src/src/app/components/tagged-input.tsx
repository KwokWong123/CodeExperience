import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface Tag {
  id: string;
  fileName: string;
  type: 'file' | 'chart';
}

interface TaggedInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  tags: Tag[];
  onAddTag: (tag: Tag) => void;
  onRemoveTag: (tagId: string) => void;
  availableArtifacts?: { fileName: string; type: 'file' | 'chart' }[];
  className?: string;
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
}

const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
    <path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z"></path>
  </svg>
);

const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
    <path d="M1.5 1.75V13.5h13.75a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75V1.75a.75.75 0 0 1 1.5 0Zm14.28 2.53-5.25 5.25a.75.75 0 0 1-1.06 0L7 7.06 4.28 9.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.25-3.25a.75.75 0 0 1 1.06 0L10 7.94l4.72-4.72a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z"></path>
  </svg>
);

export function TaggedInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  tags,
  onAddTag,
  onRemoveTag,
  availableArtifacts = [],
  className = '',
  onKeyDown,
}: TaggedInputProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [filteredArtifacts, setFilteredArtifacts] = useState<{ fileName: string; type: 'file' | 'chart' }[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    onChange(newValue);
    setCursorPosition(cursorPos);

    // Check if user typed @ to trigger artifact menu
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1 && (lastAtIndex === 0 || /\s/.test(newValue[lastAtIndex - 1]))) {
      const searchTerm = textBeforeCursor.substring(lastAtIndex + 1).toLowerCase();
      
      const filtered = availableArtifacts.filter(artifact => 
        artifact.fileName.toLowerCase().includes(searchTerm)
      );
      
      if (filtered.length > 0) {
        setFilteredArtifacts(filtered);
        setShowMenu(true);
        setSelectedIndex(0);
      } else {
        setShowMenu(false);
      }
    } else {
      setShowMenu(false);
    }
  };

  const insertTag = (artifact: { fileName: string; type: 'file' | 'chart' }) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    // Remove the @ and search text, add space after
    const newText = textBeforeCursor.substring(0, lastAtIndex) + textAfterCursor;
    
    onChange(newText.trim());
    
    // Add the tag
    const newTag: Tag = {
      id: Date.now().toString(),
      fileName: artifact.fileName,
      type: artifact.type,
    };
    onAddTag(newTag);
    
    setShowMenu(false);
    
    // Focus back on textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMenu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < filteredArtifacts.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => prev > 0 ? prev - 1 : 0);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertTag(filteredArtifacts[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowMenu(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    } else if (e.key === 'Backspace' && value === '' && tags.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      e.preventDefault();
      onRemoveTag(tags[tags.length - 1].id);
    }
    
    onKeyDown?.(e);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className={`min-h-[80px] border border-gray-300 rounded focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 ${className}`}>
        {/* Tags display */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 pb-0">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium border border-blue-200"
              >
                {tag.type === 'chart' ? (
                  <ChartIcon className="w-3.5 h-3.5" />
                ) : (
                  <FileIcon className="w-3.5 h-3.5" />
                )}
                <span>{tag.fileName}</span>
                <button
                  type="button"
                  onClick={() => onRemoveTag(tag.id)}
                  className="ml-0.5 hover:bg-blue-200 rounded-sm p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-3 py-2 resize-none border-0 focus:outline-none focus:ring-0 bg-transparent"
          style={{ minHeight: tags.length > 0 ? '60px' : '80px' }}
        />
      </div>

      {/* Artifact autocomplete menu */}
      {showMenu && (
        <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded shadow-lg overflow-hidden max-w-md w-full z-50">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
            <span className="text-xs font-medium text-gray-600">Reference artifact</span>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredArtifacts.map((artifact, index) => (
              <div
                key={artifact.fileName}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                  index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => insertTag(artifact)}
              >
                {artifact.type === 'chart' ? (
                  <ChartIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                ) : (
                  <FileIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                )}
                <span className="text-sm text-gray-900">{artifact.fileName}</span>
              </div>
            ))}
          </div>
          <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
            <span>↑↓ to navigate • Enter/Tab to select • Esc to dismiss</span>
          </div>
        </div>
      )}
    </div>
  );
}
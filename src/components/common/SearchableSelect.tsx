import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, Check } from 'lucide-react';

export interface SearchableOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  disabled?: boolean;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  label,
  required = false,
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredOptions = options.filter(opt => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      opt.label.toLowerCase().includes(q) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(q)) ||
      (opt.badge && opt.badge.toLowerCase().includes(q))
    );
  });

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Main Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-left flex items-center justify-between text-sm transition-all shadow-sm ${
          disabled
            ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed'
            : isOpen
            ? 'bg-white dark:bg-[#131B2A] border-emerald-500 ring-2 ring-emerald-500/20'
            : 'bg-white dark:bg-[#131B2A] border-slate-300 dark:border-[#202C3F] hover:border-slate-400 dark:hover:border-slate-600'
        }`}
      >
        <div className="flex-1 truncate pr-2">
          {selectedOption ? (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-white truncate">
                {selectedOption.label}
              </span>
              {selectedOption.badge && (
                <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0 text-slate-400">
          {selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  onChange('');
                }
              }}
              className="p-1 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown Menu with Search Bar */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-[#131B2A] border border-slate-200 dark:border-[#202C3F] rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Integrated Search Bar */}
          <div className="p-2 border-b border-slate-100 dark:border-[#202C3F] bg-slate-50/70 dark:bg-[#0e1624]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-[#131B2A] border border-slate-200 dark:border-[#202C3F] rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-[#202C3F]/50 p-1">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No results found for "{searchQuery}"
              </div>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs flex items-center justify-between transition ${
                      opt.disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-semibold'
                        : 'hover:bg-slate-50 dark:hover:bg-[#182235] text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-semibold">{opt.label}</div>
                      {opt.sublabel && (
                        <div className="text-[10px] text-slate-400 mt-0.5">{opt.sublabel}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {opt.badge && (
                        <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

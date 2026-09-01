import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

export interface NavigationItem {
  id: string;
  label: string;
  children?: NavigationItem[];
  onClick?: () => void;
}

interface HierarchicalDropdownProps {
  items: NavigationItem[];
  title: string;
}

const HierarchicalDropdown: React.FC<HierarchicalDropdownProps> = ({ items, title }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        {title}
      </button>

      {/* First level dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 animate-fadeIn">
          {items.map((item) => (
            <DropdownItem key={item.id} item={item} level={1} />
          ))}
        </div>
      )}
    </div>
  );
};

interface DropdownItemProps {
  item: NavigationItem;
  level: number;
}

const DropdownItem: React.FC<DropdownItemProps> = ({ item, level }) => {
  const [showChildren, setShowChildren] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const hasChildren = item.children && item.children.length > 0;

  const handleMouseEnter = () => {
    if (hasChildren) {
      setShowChildren(true);
    }
  };

  const handleClick = () => {
    if (item.onClick) {
      item.onClick();
    }
    
    if (hasChildren) {
      setShowChildren(!showChildren);
    }
  };

  return (
    <div 
      ref={itemRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShowChildren(false)}
    >
      <div
        className={`flex items-center justify-between px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors ${
          showChildren ? 'bg-blue-50' : ''
        }`}
        onClick={handleClick}
      >
        <span className="text-gray-800">{item.label}</span>
        {hasChildren && <ChevronRight className="w-4 h-4 text-gray-500" />}
      </div>

      {/* Child dropdown */}
      {showChildren && hasChildren && (
        <div 
          className="absolute left-full top-0 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 animate-slideIn"
          style={{ marginLeft: '1px' }}
        >
          {item.children!.map((child) => (
            <DropdownItem key={child.id} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HierarchicalDropdown;
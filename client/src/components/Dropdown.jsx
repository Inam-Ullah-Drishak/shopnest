import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

function Dropdown({
  value,
  onChange,
  options,
  placeholder = 'Select',
  className = '',
  buttonClassName = '',
  align = 'left',
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const listRef = useRef(null);

  const selected = options.find((o) => o.value === value);

  // Open with the current selection highlighted
  const openMenu = () => {
    setActiveIndex(options.findIndex((o) => o.value === value));
    setOpen(true);
  };

  const toggle = () => (open ? setOpen(false) : openMenu());

  // Close when clicking anywhere outside
  useEffect(() => {
    if (!open) return;

    const handleClick = (e) => {
      if (!wrapperRef.current?.contains(e.target)) setOpen(false);
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Keep the highlighted option in view
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    listRef.current?.children[activeIndex]?.scrollIntoView({
      block: 'nearest',
    });
  }, [open, activeIndex]);

  const choose = (option) => {
    onChange(option.value);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!open) {
      if (['Enter', ' ', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % options.length);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? options.length - 1 : i - 1));
      return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (options[activeIndex]) choose(options[activeIndex]);
      return;
    }

    if (e.key === 'Tab') setOpen(false);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={toggle}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full inline-flex items-center justify-between gap-2 border rounded-lg py-2.5 px-3 text-sm bg-white hover:bg-gray-50 cursor-pointer ${buttonClassName}`}
      >
        <span className={selected ? 'truncate' : 'truncate text-gray-400'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-400 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className={`absolute z-20 mt-1 min-w-full max-h-64 overflow-y-auto bg-white border rounded-lg shadow-lg py-1 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;

            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => choose(option)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`w-full flex items-center justify-between gap-3 text-left px-3 py-2 text-sm cursor-pointer ${
                    index === activeIndex ? 'bg-gray-100' : ''
                  } ${isSelected ? 'font-medium' : ''}`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && (
                    <Check size={15} className="shrink-0 text-gray-900" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default Dropdown;
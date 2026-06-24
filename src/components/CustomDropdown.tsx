import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface DropdownOption {
  value: string;
  label: string;
  colorDot?: string;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
  labelPrefix?: string;
}

export default function CustomDropdown({
  options,
  value,
  onChange,
  className = '',
  style = {},
  labelPrefix = '',
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'inline-block',
        ...style,
      }}
      className={className}
    >
      {/* Dropdown Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '0.5rem 0.75rem',
          color: '#ffffff',
          fontSize: '0.875rem',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'border-color 0.2s ease, background-color 0.2s ease',
          outline: 'none',
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {selectedOption?.colorDot && (
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: selectedOption.colorDot,
                display: 'inline-block',
              }}
            />
          )}
          <span>
            {labelPrefix ? `${labelPrefix} ` : ''}
            {selectedOption?.label}
          </span>
        </div>
        <ChevronDown
          size={14}
          style={{
            color: '#a0a0a0',
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            marginLeft: '0.5rem',
          }}
        />
      </button>

      {/* Dropdown Options List */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            backgroundColor: '#161616',
            border: '1px solid #2a2a2a',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            overflow: 'hidden',
            maxHeight: '220px',
            overflowY: 'auto',
            padding: '4px',
          }}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: isSelected ? '#ffffff' : '#b0b0b0',
                  fontSize: '0.8125rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease, color 0.15s ease',
                  marginBottom: '2px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isSelected ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isSelected ? 'rgba(255, 255, 255, 0.08)' : 'transparent';
                  e.currentTarget.style.color = isSelected ? '#ffffff' : '#b0b0b0';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {option.colorDot && (
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: option.colorDot,
                        display: 'inline-block',
                      }}
                    />
                  )}
                  <span>{option.label}</span>
                </div>
                {isSelected && <Check size={12} style={{ color: '#ffffff' }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

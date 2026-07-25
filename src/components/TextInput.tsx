import React from 'react';
import { stripNewlines } from '../utils/textSanitize';

type TextInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: string;
  onChange: (e: { target: { value: string } }) => void;
};

/**
 * Drop-in replacement for <input type="text"> for free-text fields (names,
 * descriptions, etc). Enter does nothing (no accidental form submit), any
 * newline pasted in is collapsed to a space, and leading/trailing whitespace
 * is trimmed on blur. Not for search/filter inputs that use Enter to trigger
 * a search.
 */
const TextInput: React.FC<TextInputProps> = ({ value, onChange, type = 'text', ...rest }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ target: { value: stripNewlines(e.target.value) } });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') e.preventDefault();
  };

  const handleBlur = () => {
    const trimmed = value.trim();
    if (trimmed !== value) onChange({ target: { value: trimmed } });
  };

  return (
    <input
      {...rest}
      type={type}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    />
  );
};

export default TextInput;

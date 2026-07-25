import React from 'react';
import { stripNewlines } from '../utils/textSanitize';

type TextAreaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> & {
  value: string;
  onChange: (e: { target: { value: string } }) => void;
};

/**
 * Drop-in replacement for <textarea> for free-text fields (address, description,
 * remarks, etc). Enter never inserts a line break, any newline pasted in is
 * collapsed to a space, and leading/trailing whitespace is trimmed on blur.
 */
const TextArea: React.FC<TextAreaProps> = ({ value, onChange, ...rest }) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ target: { value: stripNewlines(e.target.value) } });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') e.preventDefault();
  };

  const handleBlur = () => {
    const trimmed = value.trim();
    if (trimmed !== value) onChange({ target: { value: trimmed } });
  };

  return (
    <textarea
      {...rest}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    />
  );
};

export default TextArea;

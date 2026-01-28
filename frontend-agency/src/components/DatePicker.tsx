import { forwardRef, useEffect, useMemo, useState } from 'react';
import ReactDatePicker from 'react-datepicker';
import { format, parse, parseISO, isValid } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';

interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  id?: string;
  minDate?: Date;
  maxDate?: Date;
  showYearDropdown?: boolean;
  showMonthDropdown?: boolean;
  yearDropdownItemNumber?: number;
}

interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onInputChange?: (value: string) => void;
  onInputBlur?: () => void;
}

const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(
  ({ value, onClick, placeholder, disabled, name, id, onInputChange, onInputBlur }, ref) => (
    <input
      ref={ref}
      id={id}
      name={name}
      type="text"
      value={value || ''}
      onClick={onClick}
      onChange={(event) => onInputChange?.(event.target.value)}
      onBlur={onInputBlur}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#3E7BFA] disabled:opacity-50 disabled:cursor-not-allowed"
    />
  )
);
CustomInput.displayName = 'CustomDateInput';

export default function DatePicker({
  value,
  onChange,
  placeholder = 'Sélectionner une date',
  disabled = false,
  name,
  id,
  minDate,
  maxDate,
  showYearDropdown = false,
  showMonthDropdown = false,
  yearDropdownItemNumber = 15,
}: DatePickerProps) {
  const parsed = value ? parseISO(value) : null;
  const selected = parsed && isValid(parsed) ? parsed : null;
  const [inputValue, setInputValue] = useState('');

  const yearLimits = useMemo(() => {
    return { min: 1900, max: new Date().getFullYear() };
  }, []);

  useEffect(() => {
    if (value) {
      const parsedValue = parseISO(value);
      setInputValue(isValid(parsedValue) ? format(parsedValue, 'dd/MM/yyyy') : '');
    } else {
      setInputValue('');
    }
  }, [value]);

  const formatInput = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    const parts = [];
    if (digits.length > 0) parts.push(digits.slice(0, 2));
    if (digits.length > 2) parts.push(digits.slice(2, 4));
    if (digits.length > 4) parts.push(digits.slice(4, 8));
    return parts.join('/');
  };

  const isYearValid = (year: number) => year >= yearLimits.min && year <= yearLimits.max;

  const handleInputChange = (rawValue: string) => {
    const formatted = formatInput(rawValue);
    setInputValue(formatted);

    if (formatted.length === 10) {
      const parsedInput = parse(formatted, 'dd/MM/yyyy', new Date());
      if (isValid(parsedInput) && isYearValid(parsedInput.getFullYear())) {
        onChange(format(parsedInput, 'yyyy-MM-dd'));
      }
    }
  };

  const handleInputBlur = () => {
    if (!inputValue) {
      onChange('');
      return;
    }

    if (inputValue.length === 10) {
      const parsedInput = parse(inputValue, 'dd/MM/yyyy', new Date());
      if (isValid(parsedInput) && isYearValid(parsedInput.getFullYear())) {
        setInputValue(format(parsedInput, 'dd/MM/yyyy'));
        onChange(format(parsedInput, 'yyyy-MM-dd'));
        return;
      }
    }

    if (value) {
      const parsedValue = parseISO(value);
      setInputValue(isValid(parsedValue) ? format(parsedValue, 'dd/MM/yyyy') : '');
    } else {
      setInputValue('');
    }
  };

  return (
    <ReactDatePicker
      selected={selected}
      onChange={(date) => {
        if (!date) {
          onChange('');
          return;
        }
        onChange(format(date, 'yyyy-MM-dd'));
        setInputValue(format(date, 'dd/MM/yyyy'));
      }}
      dateFormat="dd/MM/yyyy"
      placeholderText={placeholder}
      disabled={disabled}
      minDate={minDate}
      maxDate={maxDate}
      showYearDropdown={showYearDropdown}
      showMonthDropdown={showMonthDropdown}
      yearDropdownItemNumber={yearDropdownItemNumber}
      scrollableYearDropdown={showYearDropdown}
      dropdownMode="select"
      showPopperArrow={false}
      popperPlacement="bottom-start"
      calendarClassName="maloc-date-picker"
      popperClassName="maloc-date-picker-popper"
      customInput={(
        <CustomInput
          name={name}
          id={id}
          value={inputValue}
          onInputChange={handleInputChange}
          onInputBlur={handleInputBlur}
        />
      )}
    />
  );
}

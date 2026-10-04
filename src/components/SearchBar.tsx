import type { FormEvent, KeyboardEvent } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSearch?: (q: string) => void;
  compact?: boolean;
}

export default function SearchBar({
  placeholder,
  value,
  onChange,
  onSearch,
  compact = false,
}: SearchBarProps) {
  const submit = () => {
    const query = value.trim();
    if (query && onSearch) onSearch(query);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submit();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  return (
    <form role="search" onSubmit={handleSubmit} className="relative w-full">
      <Search
        size={compact ? 14 : 16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={placeholder}
        className={`w-full rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 ${
          compact
            ? "py-1.5 pl-8 pr-8 text-xs [&::-webkit-search-cancel-button]:hidden"
            : "py-2 pl-9 pr-9 text-sm [&::-webkit-search-cancel-button]:hidden"
        }`}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          <X size={compact ? 14 : 16} aria-hidden="true" />
        </button>
      )}
    </form>
  );
}

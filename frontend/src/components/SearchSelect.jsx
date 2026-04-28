import { useState, useRef, useEffect } from 'react'

export default function SearchSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Chercher…',
  displayKey = 'titre',
  valueKey = 'id',
  required = false
}) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef(null)

  const filtered = options.filter(opt =>
    String(opt[displayKey]).toLowerCase().includes(search.toLowerCase())
  )

  const selected = options.find(opt => opt[valueKey] === value)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2 input p-0 overflow-hidden">
        <input
          type="text"
          placeholder={selected ? '' : placeholder}
          value={isOpen ? search : selected ? String(selected[displayKey]) : ''}
          onChange={(e) => { setSearch(e.target.value); setIsOpen(true) }}
          onFocus={() => setIsOpen(true)}
          className="flex-1 bg-transparent px-3 py-2 outline-none text-sm"
          required={required && !value}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-2 py-2 text-gray-400 hover:text-gray-600 text-lg"
        >
          ▼
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400 text-center">
              Aucune option trouvée
            </div>
          ) : (
            filtered.map((opt) => (
              <button
                key={opt[valueKey]}
                type="button"
                onClick={() => {
                  onChange({ target: { value: opt[valueKey] } })
                  setSearch('')
                  setIsOpen(false)
                }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors ${
                  value === opt[valueKey] ? 'bg-blue-100 text-blue-900 font-semibold' : ''
                }`}
              >
                {opt[displayKey]}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

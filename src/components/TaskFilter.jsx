import { useState, useEffect } from 'react'

export default function TaskFilter({ onFilterChange, initialFilters = {} }) {
  const [filters, setFilters] = useState({
    status: initialFilters.status || '',
    category: initialFilters.category || ''
  })

  useEffect(() => {
    // Aktualisiere Filter, wenn sich initialFilters ändert
    if (initialFilters) {
      setFilters(prev => ({
        ...prev,
        ...initialFilters
      }))
    }
  }, [initialFilters])

  // Auf "ausstehend" und "abgeschlossen" beschränken
  const statusOptions = [
    { value: '', label: 'Alle Status' },
    { value: 'ausstehend', label: 'Ausstehend' },
    { value: 'abgeschlossen', label: 'Abgeschlossen' }
  ]

  // Erweiterte Kategorien
  const categoryOptions = [
    { value: '', label: 'Alle Kategorien' },
    { value: 'programmierung', label: 'Programmierung' },
    { value: 'webentwicklung', label: 'Webentwicklung' },
    { value: 'datenbank', label: 'Datenbank' },
    { value: 'frontend', label: 'Frontend' },
    { value: 'backend', label: 'Backend' },
    { value: 'devops', label: 'DevOps' },
    { value: 'testing', label: 'Testing' },
    { value: 'security', label: 'Sicherheit' },
    { value: 'mobile', label: 'Mobile Entwicklung' },
    { value: 'algorithmen', label: 'Algorithmen' }
  ]

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  return (
    <div className="task-filter">
      <div className="filter-group">
        <label htmlFor="status-filter">Status:</label>
        <select 
          id="status-filter"
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="filter-select"
        >
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="category-filter">Kategorie:</label>
        <select 
          id="category-filter"
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="filter-select"
        >
          {categoryOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button 
        onClick={() => {
          const resetFilters = { status: '', category: '' }
          setFilters(resetFilters)
          onFilterChange(resetFilters)
        }}
        className="reset-filter-btn"
      >
        Filter zurücksetzen
      </button>
    </div>
  )
} 
import { useCallback } from 'react'
import { useTasks } from '../hooks/useTasks'
import dynamic from 'next/dynamic'

// Lazy-Loading für die TaskCard-Komponente
const TaskCard = dynamic(() => import('./TaskCard'), { 
  loading: () => <div className="skeleton-card"></div>
})

export default function TaskList({ category }) {
  const { 
    tasks, 
    loading, 
    error, 
    pagination, 
    loadMore, 
    refresh 
  } = useTasks({ 
    initialPage: 0, 
    limit: 10, 
    category 
  })

  // Intersection Observer für unendliches Scrollen
  const lastTaskRef = useCallback(node => {
    if (loading) return
    
    if (node) {
      const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && pagination.hasMore) {
          loadMore()
        }
      }, { threshold: 0.5 })
      
      observer.observe(node)
      
      return () => observer.disconnect()
    }
  }, [loading, pagination.hasMore, loadMore])

  if (error) {
    return <div className="error-message">Fehler: {error}</div>
  }

  return (
    <div className="task-list">
      {tasks.map((task, index) => (
        <div 
          key={task.id} 
          ref={index === tasks.length - 1 ? lastTaskRef : null}
        >
          <TaskCard task={task} />
        </div>
      ))}
      
      {loading && (
        <div className="loading-indicator">Lädt weitere Aufgaben...</div>
      )}
      
      {!pagination.hasMore && tasks.length > 0 && (
        <div className="end-message">Keine weiteren Aufgaben verfügbar</div>
      )}
      
      {tasks.length === 0 && !loading && (
        <div className="empty-message">Keine Aufgaben gefunden</div>
      )}
    </div>
  )
} 
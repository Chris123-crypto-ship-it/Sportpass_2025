import { useEffect } from 'react'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import { clearCache } from '../utils/cacheUtils'

// Lazy-loaded components
const TaskList = dynamic(() => import('../components/TaskList'), {
  loading: () => <div className="skeleton-card"></div>
})

export default function Home() {
  useEffect(() => {
    // Cache beim Verlassen der Seite aufräumen
    return () => {
      clearCache()
    }
  }, [])

  return (
    <div className="container">
      <Head>
        <title>Aufgabenportal</title>
        <meta name="description" content="Entdecke und löse Aufgaben" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <main>
        <h1>Verfügbare Aufgaben</h1>
        <TaskList />
      </main>
    </div>
  )
}

// Statische Generierung für bessere Performance
export async function getStaticProps() {
  return {
    props: {},
    // Neuvalidierung alle 5 Minuten
    revalidate: 300
  }
} 
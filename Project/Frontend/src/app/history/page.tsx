'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Youtube, Trash2, MessageSquare, Clock, PlayCircle, ArrowRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { fadeInUp, fadeIn } from '@/lib/animations'

interface HistoryItem {
  _id: string
  video_id: string
  video_url: string
  title: string
  messages: { role: string; content: string }[]
  saved_at: string
}

export default function HistoryPage() {
  const { user, token, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  // Fetch history
  useEffect(() => {
    if (!token) return
    const fetchHistory = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/history/list', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('Failed to load history.')
        const data = await res.json()
        setHistory(data.history)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load history.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchHistory()
  }, [token])

  const handleDelete = async (id: string) => {
    if (!token) return
    setDeletingId(id)
    try {
      const res = await fetch(`http://localhost:8000/api/history/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to delete.')
      setHistory(prev => prev.filter(h => h._id !== id))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed.')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  if (authLoading || (!user && !authLoading)) return null

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-surface)' }}>
      <Navbar variant="chat" />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
        {/* Header */}
        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="mb-8">
          <h1 className="text-3xl font-extrabold" style={{ color: 'var(--color-text-primary)' }}>
            Chat History
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Your past video conversations
          </p>
        </motion.div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="flex gap-2">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-3 h-3 rounded-full"
                  style={{ background: 'var(--color-accent)' }}
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="rounded-2xl px-5 py-4 mb-6 text-sm"
            style={{ background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)', color: 'var(--color-accent)' }}
          >
            {error}
          </motion.div>
        )}

        {/* Empty state */}
        {!isLoading && history.length === 0 && !error && (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
              style={{ background: 'var(--color-surface-elevated)' }}
            >
              <MessageSquare className="w-10 h-10" style={{ color: 'var(--color-text-secondary)' }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              No history yet
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              Start a conversation with a YouTube video to see it here.
            </p>
            <motion.a
              href="/use"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-sm font-semibold shadow-lg"
              style={{ background: 'linear-gradient(135deg, var(--color-accent), #ec4899)' }}
            >
              Start Chatting <ArrowRight className="h-4 w-4" />
            </motion.a>
          </motion.div>
        )}

        {/* History list */}
        {!isLoading && history.length > 0 && (
          <div className="space-y-4">
            <AnimatePresence>
              {history.map((item, i) => (
                <motion.div
                  key={item._id}
                  custom={i}
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                  className="rounded-2xl border p-5 flex gap-4 items-start group transition-all duration-200"
                  style={{
                    background: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                    boxShadow: '0 2px 12px var(--color-shadow)',
                  }}
                  whileHover={{ y: -2, boxShadow: '0 8px 24px var(--color-shadow)' }}
                >
                  {/* Thumbnail */}
                  <div
                    className="flex-shrink-0 w-24 h-16 rounded-xl overflow-hidden flex items-center justify-center"
                    style={{ background: 'var(--color-surface-elevated)' }}
                  >
                    {item.video_id ? (
                      <img
                        src={`https://img.youtube.com/vi/${item.video_id}/mqdefault.jpg`}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={e => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <PlayCircle className="w-8 h-8" style={{ color: 'var(--color-text-secondary)' }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-semibold text-sm truncate mb-1"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {item.title || `Video: ${item.video_id}`}
                    </h3>
                    <div className="flex items-center gap-3 text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {item.messages?.length ?? 0} messages
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(item.saved_at)}
                      </span>
                    </div>
                    {/* Preview of last message */}
                    {item.messages?.length > 0 && (
                      <p
                        className="text-xs truncate"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {item.messages[item.messages.length - 1]?.content}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <motion.a
                      href={`/use?video=${item.video_id}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                      style={{ background: 'var(--color-accent)' }}
                    >
                      <Youtube className="w-3 h-3" /> Open
                    </motion.a>
                    <motion.button
                      onClick={() => handleDelete(item._id)}
                      disabled={deletingId === item._id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
                      style={{
                        background: 'var(--color-surface-elevated)',
                        color: 'var(--color-text-secondary)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                      {deletingId === item._id ? '...' : 'Delete'}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  )
}

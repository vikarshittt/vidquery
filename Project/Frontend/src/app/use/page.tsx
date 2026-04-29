'use client'

import { useState, FormEvent, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Youtube, Send, User, Brain, AlertTriangle, Link, MessageCircleQuestion } from 'lucide-react'
import Navbar from '@/components/Navbar'
import VoiceSearchButton from '@/components/VoiceSearchButton'
import { fadeInUp } from '@/lib/animations'

const extractVideoId = (url: string): string | null => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const regex =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    const match = url.match(regex)
    return match ? match[1] : null
  }
  if (url.length === 11) return url
  return null
}

type Message = {
  role: 'user' | 'bot'
  content: string
  isError?: boolean
}

export default function ChatPage() {
  const [url, setUrl] = useState('')
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const videoId = useMemo(() => extractVideoId(url), [url])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!videoId) {
      setMessages(prev => [...prev, { role: 'bot', content: 'Please enter a valid YouTube URL or Video ID first.', isError: true }])
      return
    }

    setIsLoading(true)
    const userMessageContent = query
    setMessages(prev => [...prev, { role: 'user', content: userMessageContent }])
    setQuery('')

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: videoId, query: userMessageContent }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.detail || 'Failed to get answer from backend.')
      }

      const data = await response.json()
      setMessages(prev => [...prev, { role: 'bot', content: data.answer }])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.'
      setMessages(prev => [...prev, { role: 'bot', content: message, isError: true }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--color-surface-elevated)' }}>
      <Navbar variant="chat" />

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <ChatMessage key={idx} message={msg} />
              ))}
            </AnimatePresence>
            <AnimatePresence>{isLoading && <TypingIndicator />}</AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div
            className="p-4 md:p-6 border-t"
            style={{
              background: 'var(--color-glass-bg)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderColor: 'var(--color-border)',
            }}
          >
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* URL input */}
              <div
                className="flex items-center space-x-2 rounded-full px-4 py-1 border"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              >
                <Link className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }} />
                <input
                  type="text"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="Paste YouTube URL or Video ID here..."
                  className="flex-1 bg-transparent py-2 text-sm outline-none"
                  style={{ color: 'var(--color-text-primary)' }}
                  required
                />
              </div>

              {/* Query input with voice + send */}
              <div
                className="flex items-center space-x-2 rounded-full px-4 py-1 border"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              >
                <MessageCircleQuestion className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }} />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Ask your question..."
                  className="flex-1 bg-transparent py-2 text-sm outline-none"
                  style={{ color: 'var(--color-text-primary)' }}
                  required
                />
                {/* Voice search button */}
                <VoiceSearchButton
                  onResult={(transcript) => setQuery(transcript)}
                  onError={(msg) =>
                    setMessages(prev => [...prev, { role: 'bot', content: msg, isError: true }])
                  }
                />
                {/* Send button */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-full text-white shadow-sm disabled:opacity-50 flex-shrink-0"
                  style={{ background: 'var(--color-accent)' }}
                >
                  <Send className="h-5 w-5" />
                </motion.button>
              </div>
            </form>
          </div>
        </div>

        {/* Video preview sidebar */}
        <div
          className="w-full md:w-2/5 lg:w-1/3 p-4 md:p-6 border-l overflow-y-auto"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Video Preview
          </h2>
          <VideoPreview videoId={videoId} />
        </div>
      </main>
    </div>
  )
}

function ChatMessage({ message }: { message: Message }) {
  const isBot = message.role === 'bot'
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className={`flex items-start space-x-3 ${!isBot ? 'justify-end' : ''}`}
    >
      {isBot && (
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: message.isError ? 'color-mix(in srgb, var(--color-accent) 15%, transparent)' : '#1e293b' }}
        >
          {message.isError
            ? <AlertTriangle className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
            : <Brain className="w-5 h-5 text-red-500" />
          }
        </div>
      )}
      <div
        className="p-3 rounded-2xl max-w-lg"
        style={
          isBot
            ? {
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: message.isError ? 'var(--color-accent)' : 'var(--color-text-primary)',
                boxShadow: '0 2px 8px var(--color-shadow)',
              }
            : {
                background: 'var(--color-accent)',
                color: '#ffffff',
                boxShadow: '0 2px 8px var(--color-shadow)',
              }
        }
      >
        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
      </div>
      {!isBot && (
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }}
        >
          <User className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
        </div>
      )}
    </motion.div>
  )
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.1 } }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex items-start space-x-3"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#1e293b' }}>
        <Brain className="w-5 h-5 text-red-500" />
      </div>
      <div
        className="p-3 rounded-2xl"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 2px 8px var(--color-shadow)',
        }}
      >
        <div className="flex space-x-1">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ background: 'var(--color-text-secondary)' }}
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function VideoPreview({ videoId }: { videoId: string | null }) {
  if (!videoId) {
    return (
      <div
        className="aspect-video w-full rounded-2xl flex items-center justify-center border border-dashed"
        style={{ background: 'var(--color-surface-elevated)', borderColor: 'var(--color-border)' }}
      >
        <div className="text-center" style={{ color: 'var(--color-text-secondary)' }}>
          <Youtube className="h-12 w-12 mx-auto opacity-40" />
          <p className="mt-2 text-sm">Video preview will appear here</p>
        </div>
      </div>
    )
  }
  return (
    <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-md">
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  )
}

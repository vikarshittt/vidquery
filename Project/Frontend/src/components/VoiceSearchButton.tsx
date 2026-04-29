'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Mic } from 'lucide-react'

interface VoiceSearchButtonProps {
  onResult: (transcript: string) => void
  onError: (message: string) => void
}

// Extend window type for webkit prefix
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

function getErrorMessage(errorType: string): string {
  switch (errorType) {
    case 'not-allowed':
      return 'Microphone permission denied. Please allow access and try again.'
    case 'no-speech':
      return 'No speech detected. Please try again.'
    case 'network':
      return 'Network error during speech recognition. Please check your connection.'
    case 'audio-capture':
      return 'No microphone found. Please connect a microphone and try again.'
    default:
      return 'Speech recognition error. Please try again.'
  }
}

export default function VoiceSearchButton({ onResult, onError }: VoiceSearchButtonProps) {
  const [isSupported, setIsSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  // Track whether we already got a result so we don't fire errors after success
  const gotResultRef = useRef(false)

  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    setIsSupported(supported)
  }, [])

  // Cleanup on unmount — abort silently, no error shown
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
    }
  }, [])

  if (!isSupported) return null

  const handleClick = () => {
    if (isListening) {
      // User manually stopped — abort silently
      recognitionRef.current?.abort()
      setIsListening(false)
      return
    }

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    gotResultRef.current = false

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      gotResultRef.current = true
      const transcript = event.results[0][0].transcript
      onResult(transcript)
      setIsListening(false)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // 'aborted' fires when we call .abort() ourselves — ignore it entirely
      if (event.error === 'aborted') {
        setIsListening(false)
        return
      }
      // Also suppress errors if we already got a successful result
      if (gotResultRef.current) {
        setIsListening(false)
        return
      }
      onError(getErrorMessage(event.error))
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      aria-label={isListening ? 'Stop listening' : 'Start voice input'}
      className={`p-2 rounded-full transition-colors duration-200 flex-shrink-0 ${
        isListening
          ? 'bg-red-100 text-red-600'
          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface-elevated)]'
      }`}
    >
      <motion.div
        animate={isListening ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        transition={
          isListening
            ? { duration: 0.8, repeat: Infinity, ease: 'easeInOut' }
            : {}
        }
      >
        <Mic className="h-5 w-5" />
      </motion.div>
    </motion.button>
  )
}

'use client'

import { motion } from 'framer-motion'
import { Youtube, History, LogOut, User } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

interface NavbarProps {
  variant?: 'landing' | 'chat'
}

export default function Navbar({ variant = 'landing' }: NavbarProps) {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <nav
      className="sticky top-0 z-50 w-full border-b border-[var(--color-border)] transition-colors duration-300"
      style={{ background: 'var(--color-glass-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
    >
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.a
            href="/"
            whileHover={{ scale: 1.05 }}
            className="flex-shrink-0 flex items-center cursor-pointer no-underline"
          >
            <Youtube className="h-8 w-8 text-[var(--color-accent)]" />
            <span className="ml-2 text-2xl font-bold text-[var(--color-text-primary)]">
              Vid<span className="text-[var(--color-accent)]">Query</span>
            </span>
          </motion.a>

          {/* Right side */}
          <div className="flex items-center space-x-3 md:space-x-4">
            {variant === 'landing' && !user && (
              <>
                <a
                  href="#features"
                  className="hidden md:block font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-200"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="hidden md:block font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-200"
                >
                  How It Works
                </a>
                <a
                  href="/login"
                  className="hidden md:block font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-200"
                >
                  Sign In
                </a>
                <motion.a
                  href="/signup"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="hidden md:inline-flex items-center px-4 py-2 text-sm font-medium rounded-full text-white shadow-md"
                  style={{ background: 'var(--color-accent)' }}
                >
                  Get Started
                </motion.a>
              </>
            )}

            {variant === 'landing' && user && (
              <>
                <a
                  href="#features"
                  className="hidden md:block font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-200"
                >
                  Features
                </a>
                <motion.a
                  href="/use"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="hidden md:inline-flex items-center px-4 py-2 text-sm font-medium rounded-full text-white shadow-md"
                  style={{ background: 'var(--color-accent)' }}
                >
                  Open App
                </motion.a>
              </>
            )}

            {variant === 'chat' && (
              <>
                <a
                  href="/use"
                  className="font-medium text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-200"
                >
                  New Chat
                </a>
                <a
                  href="/history"
                  className="flex items-center gap-1.5 font-medium text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-200"
                >
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline">History</span>
                </a>
              </>
            )}

            {/* User menu */}
            {user ? (
              <div className="flex items-center gap-2">
                <div
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border"
                  style={{ background: 'var(--color-surface-elevated)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  <User className="h-3.5 w-3.5" />
                  <span>{user.name}</span>
                </div>
                <motion.button
                  onClick={handleLogout}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Sign out"
                  className="p-2 rounded-full border transition-colors duration-200"
                  style={{ background: 'var(--color-surface-elevated)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  <LogOut className="h-4 w-4" />
                </motion.button>
              </div>
            ) : (
              variant !== 'landing' && (
                <a
                  href="/login"
                  className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-200"
                >
                  Sign In
                </a>
              )
            )}

            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  )
}

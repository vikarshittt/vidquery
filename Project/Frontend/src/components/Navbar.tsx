'use client'

import { motion } from 'framer-motion'
import { Youtube } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

interface NavbarProps {
  variant?: 'landing' | 'chat'
}

export default function Navbar({ variant = 'landing' }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[var(--color-border)] transition-colors duration-300"
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
          <div className="flex items-center space-x-4 md:space-x-6">
            {variant === 'landing' && (
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
                <motion.a
                  href="/use"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="hidden md:inline-flex items-center px-4 py-2 text-sm font-medium rounded-full text-white shadow-md transition-colors duration-200"
                  style={{ background: 'var(--color-accent)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-accent-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-accent)')}
                >
                  Get Started
                </motion.a>
              </>
            )}

            {variant === 'chat' && (
              <a
                href="/use"
                className="font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-200"
              >
                New Chat
              </a>
            )}

            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  )
}

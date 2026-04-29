'use client'

import { useState, FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Youtube, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { fadeInUp, buttonHover } from '@/lib/animations'
import ThemeToggle from '@/components/ThemeToggle'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const res = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Login failed.')

      login(data.token, { name: data.name, email: data.email })
      router.push('/use')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(135deg, var(--color-surface) 0%, color-mix(in srgb, var(--color-accent) 8%, var(--color-surface)) 100%)' }}
    >
      {/* Top bar */}
      <div className="flex justify-between items-center px-6 py-4">
        <motion.a
          href="/"
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 no-underline"
        >
          <Youtube className="h-7 w-7" style={{ color: 'var(--color-accent)' }} />
          <span className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Vid<span style={{ color: 'var(--color-accent)' }}>Query</span>
          </span>
        </motion.a>
        <ThemeToggle />
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md rounded-3xl border p-8 shadow-2xl"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            boxShadow: '0 25px 60px var(--color-shadow)',
          }}
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold" style={{ color: 'var(--color-text-primary)' }}>
              Welcome back
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Sign in to continue to VidQuery
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                Email
              </label>
              <div
                className="flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200 focus-within:ring-2"
                style={{
                  background: 'var(--color-surface-elevated)',
                  borderColor: 'var(--color-border)',
                  // @ts-expect-error css var
                  '--tw-ring-color': 'var(--color-accent)',
                }}
              >
                <Mail className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: 'var(--color-text-primary)' }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                Password
              </label>
              <div
                className="flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200 focus-within:ring-2"
                style={{ background: 'var(--color-surface-elevated)', borderColor: 'var(--color-border)' }}
              >
                <Lock className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: 'var(--color-text-primary)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="flex-shrink-0"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-center rounded-xl px-4 py-2"
                style={{ background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)', color: 'var(--color-accent)' }}
              >
                {error}
              </motion.p>
            )}

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading}
              variants={buttonHover}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm shadow-lg disabled:opacity-60 transition-opacity"
              style={{ background: 'linear-gradient(135deg, var(--color-accent), #ec4899)' }}
            >
              {isLoading ? (
                <span className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-white"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                    />
                  ))}
                </span>
              ) : (
                <>Sign In <ArrowRight className="h-4 w-4" /></>
              )}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Don&apos;t have an account?{' '}
            <a href="/signup" className="font-semibold hover:underline" style={{ color: 'var(--color-accent)' }}>
              Sign up
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

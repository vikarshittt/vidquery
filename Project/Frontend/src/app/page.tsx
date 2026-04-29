'use client'

import { motion } from 'framer-motion'
import {
  MessageCircleQuestion,
  FileText,
  Clock,
  Link,
  HelpCircle,
  Brain,
  PlayCircle,
  ArrowRight,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import { fadeInUp, fadeIn, scaleIn, buttonHover } from '@/lib/animations'

// --------------------------
// Main Page Component
// --------------------------
export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--color-surface)' }}>
      <Navbar variant="landing" />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}

// --------------------------
// Hero Section
// --------------------------
function HeroSection() {
  return (
    <section
      className="relative w-full pt-20 pb-24 md:pt-32 md:pb-40 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, var(--color-surface) 0%, color-mix(in srgb, var(--color-accent) 8%, var(--color-surface)) 100%)' }}
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(var(--color-border) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="text-center md:text-left"
          >
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
              Chat with Any <br />
              <span style={{ color: 'var(--color-accent)' }}>YouTube Video</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl max-w-lg mx-auto md:mx-0" style={{ color: 'var(--color-text-secondary)' }}>
              Get instant summaries, find specific answers, and extract key insights. Stop scrubbing, start asking.
            </p>

            <motion.a
              href="/use"
              variants={buttonHover}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
              className="mt-10 inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-full text-white shadow-lg transition"
              style={{ background: 'linear-gradient(135deg, var(--color-accent), #ec4899)' }}
            >
              Try It Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </motion.a>
          </motion.div>

          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
          >
            <HeroAnimation />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// --------------------------
// Hero Animation
// --------------------------
function HeroAnimation() {
  const bubbles = [
    { id: 1, text: 'What is this video about?', delay: 0 },
    { id: 2, text: 'Summarize the key points', delay: 2 },
    { id: 3, text: 'When do they talk about...?', delay: 4 },
  ]

  return (
    <div
      className="relative w-full h-90 rounded-2xl p-6 shadow-2xl border"
      style={{
        background: 'var(--color-surface-elevated)',
        borderColor: 'var(--color-border)',
        boxShadow: '0 25px 50px var(--color-shadow)',
      }}
    >
      <div className="flex justify-between items-center h-full">
        <div
          className="w-2/5 h-full rounded-xl flex items-center justify-center shadow-2xl hover:shadow-red-500/50 transition-shadow duration-500"
          style={{ background: '#1e293b' }}
        >
          <PlayCircle className="w-16 h-16 text-red-500 opacity-90 animate-pulse" />
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          {bubbles.map((bubble) => (
            <motion.div
              key={bubble.id}
              className="absolute p-2 px-3 rounded-lg shadow-lg text-sm"
              style={{ background: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
              initial={{ opacity: 0, scale: 0.5, x: -50 }}
              animate={{ opacity: [0, 1, 1, 0], scale: 1, x: 50 }}
              transition={{
                duration: 3,
                delay: bubble.delay,
                repeat: Infinity,
                repeatDelay: 3,
                ease: 'easeInOut',
              }}
            >
              {bubble.text}
            </motion.div>
          ))}
        </div>

        <div
          className="w-2/5 h-full rounded-xl p-3 flex flex-col shadow-md"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex-grow space-y-2">
            <div className="p-2 rounded-lg text-xs self-start animate-pulse" style={{ background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)', color: 'var(--color-accent)' }}>
              Summary, please!
            </div>
            <div className="p-2 rounded-lg text-xs self-end" style={{ background: 'var(--color-surface-elevated)', color: 'var(--color-text-secondary)' }}>
              Sure! Here is the summary...
            </div>
          </div>
          <div className="h-10 rounded-full flex items-center p-2" style={{ background: 'var(--color-surface-elevated)' }}>
            <input
              type="text"
              placeholder="Ask anything..."
              className="bg-transparent text-sm w-full outline-none px-2"
              style={{ color: 'var(--color-text-secondary)' }}
              disabled
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// --------------------------
// Features Section
// --------------------------
function FeaturesSection() {
  const features = [
    { icon: FileText, title: 'Instant Summaries', description: 'Get a concise summary of any video in seconds. Perfect for long lectures or podcasts.' },
    { icon: MessageCircleQuestion, title: 'Ask Anything', description: 'Ask specific questions and get answers pulled directly from the video transcript.' },
    { icon: Clock, title: 'Find Key Moments', description: 'Get the exact timestamps for the information you need. No more aimless scrubbing.' },
  ]

  return (
    <section id="features" className="py-24" style={{ background: 'var(--color-surface-elevated)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-16"
        >
          <h2 className="text-base font-semibold tracking-wide uppercase" style={{ color: 'var(--color-accent)' }}>Features</h2>
          <p className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            Work Smarter, Not Harder
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              custom={i}
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              className="p-8 rounded-2xl border transition-all duration-300"
              style={{
                background: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                boxShadow: '0 4px 16px var(--color-shadow)',
              }}
              whileHover={{ y: -10, scale: 1.02 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-center h-12 w-12 rounded-xl text-white" style={{ background: 'var(--color-accent)' }}>
                <feature.icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="mt-6">
                <h3 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{feature.title}</h3>
                <p className="mt-4 text-base" style={{ color: 'var(--color-text-secondary)' }}>{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// --------------------------
// How It Works Section
// --------------------------
function HowItWorksSection() {
  const steps = [
    { icon: Link, title: 'Step 1: Paste URL', description: 'Grab any YouTube URL and paste it into the search bar.' },
    { icon: HelpCircle, title: 'Step 2: Ask Your Question', description: 'Ask for a summary, a specific fact, or a list of key moments.' },
    { icon: Brain, title: 'Step 3: Get AI Answers', description: 'Our AI reads the transcript and gives you a perfect answer, fast.' },
  ]

  return (
    <section id="how-it-works" className="py-24" style={{ background: 'var(--color-surface)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-16"
        >
          <h2 className="text-base font-semibold tracking-wide uppercase" style={{ color: 'var(--color-accent)' }}>How It Works</h2>
          <p className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            Get Answers in Seconds
          </p>
        </motion.div>

        <div className="relative">
          <div className="absolute left-1/2 top-4 bottom-4 w-1 rounded-full -translate-x-1/2" style={{ background: 'var(--color-border)' }} aria-hidden="true" />
          <div className="space-y-16">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                custom={i}
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.5 }}
                className="relative flex items-center"
              >
                <div className="flex-1">
                  <div
                    className={`p-6 rounded-2xl border ${i % 2 === 0 ? 'text-right' : 'text-left'}`}
                    style={{
                      background: 'var(--color-surface-elevated)',
                      borderColor: 'var(--color-border)',
                      boxShadow: '0 4px 16px var(--color-shadow)',
                    }}
                  >
                    <h3 className="text-xl font-bold" style={{ color: 'var(--color-accent)' }}>{step.title}</h3>
                    <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>{step.description}</p>
                  </div>
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 z-10">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg" style={{ background: 'var(--color-accent)' }}>
                    <step.icon className="w-8 h-8" />
                  </div>
                </div>
                <div className="flex-1" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// --------------------------
// CTA Section
// --------------------------
function CTASection() {
  return (
    <section style={{ background: 'linear-gradient(135deg, var(--color-accent), #ec4899)' }}>
      <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 sm:py-24 lg:px-8 text-center text-white">
        <motion.h2
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          className="text-3xl font-extrabold sm:text-4xl"
        >
          Supercharge Your Workflow
        </motion.h2>
        <motion.p
          variants={fadeInUp}
          custom={1}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          className="mt-4 text-lg leading-6 opacity-80"
        >
          Stop wasting time. Start getting answers. Try VidQuery for free today.
        </motion.p>
        <motion.a
          href="/use"
          variants={buttonHover}
          initial="rest"
          whileHover="hover"
          whileTap="tap"
          className="mt-8 inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-full shadow-lg transition"
          style={{ background: 'var(--color-surface)', color: 'var(--color-accent)' }}
        >
          Get Started — It&apos;s Free
        </motion.a>
      </div>
    </section>
  )
}

// --------------------------
// Footer
// --------------------------
function Footer() {
  return (
    <footer style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8 flex justify-center" style={{ color: 'var(--color-text-secondary)' }}>
        &copy; {new Date().getFullYear()} VidQuery. All rights reserved.
      </div>
    </footer>
  )
}

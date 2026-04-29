

// app/page.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircleQuestion,
  FileText,
  Clock,
  Link,
  HelpCircle,
  Brain,
  Youtube,
  PlayCircle,
  ArrowRight,
} from 'lucide-react'

// --------------------------
// Main Page Component
// --------------------------
export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
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
// 1. Navbar
// --------------------------
function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 transition-all duration-500">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <motion.div whileHover={{ scale: 1.05 }} className="flex-shrink-0 flex items-center cursor-pointer">
            <Youtube className="h-8 w-8 text-red-600" />
            <span className="ml-2 text-2xl font-bold text-gray-900">
              Vid<span className="text-red-600">Query</span>
            </span>
          </motion.div>

          <div className="hidden md:flex md:items-center md:space-x-8">
            <a href="#features" className="font-medium text-gray-600 hover:text-gray-900 transition">
              Features
            </a>
            <a href="#how-it-works" className="font-medium text-gray-600 hover:text-gray-900 transition">
              How It Works
            </a>
            <a
              href="/use"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 shadow-md transition"
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}

// --------------------------
// 2. Hero Section
// --------------------------
function HeroSection() {
  return (
    <section className="relative w-full pt-20 pb-24 md:pt-32 md:pb-40 overflow-hidden bg-gradient-to-br from-white to-red-50">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="text-center md:text-left"
          >
            <h1 className="text-5xl md:text-7xl lg:text-7xl font-extrabold tracking-tight text-gray-900">
              Chat with Any <br />
              <span className="text-red-600">YouTube Video</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-lg mx-auto md:mx-0">
              Get instant summaries, find specific answers, and extract key insights. Stop scrubbing, start asking.
            </p>

            <motion.a
              href="/use"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mt-10 inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-full text-white bg-gradient-to-r from-red-500 to-pink-500 hover:from-pink-500 hover:to-red-500 shadow-lg transition"
            >
              Try It Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </motion.a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
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
    <div className="relative w-full h-90 rounded-xl bg-gray-100 p-6 shadow-xl border border-gray-200">
      <div className="flex justify-between items-center h-full">
        <div className="w-2/5 h-full bg-gray-800 rounded-lg flex items-center justify-center shadow-2xl hover:shadow-red-500/50 transition-shadow duration-500">
          <PlayCircle className="w-16 h-16 text-red-500 opacity-90 animate-pulse" />
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          {bubbles.map((bubble) => (
            <motion.div
              key={bubble.id}
              className="absolute bg-white p-2 px-3 rounded-lg shadow-lg text-sm text-gray-700"
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

        <div className="w-2/5 h-full bg-white rounded-lg p-3 flex flex-col shadow-md">
          <div className="flex-grow space-y-2">
            <div className="p-2 bg-red-100 text-red-800 rounded-lg text-xs self-start animate-pulse">
              Summary, please!
            </div>
            <div className="p-2 bg-gray-100 text-gray-800 rounded-lg text-xs self-end animate-fadeIn">
              Sure! Here is the summary...
            </div>
          </div>
          <div className="h-10 bg-gray-100 rounded-full flex items-center p-2">
            <input
              type="text"
              placeholder="Ask anything..."
              className="bg-transparent text-sm w-full outline-none px-2"
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
    <section id="features" className="py-24 bg-gray-170">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-base font-semibold text-red-600 tracking-wide uppercase">Features</h2>
          <p className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Work Smarter, Not Harder</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              whileHover={{ y: -10, scale: 1.02, rotateZ: 1 }}
              className="bg-white p-8 rounded-xl shadow-2xl border border-gray-100 transition-transform duration-300"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-red-600 text-white">
                  <feature.icon className="h-6 w-6" aria-hidden="true" />
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                <p className="mt-4 text-base text-gray-600">{feature.description}</p>
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
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-base font-semibold text-red-600 tracking-wide uppercase">How It Works</h2>
          <p className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Get Answers in Seconds</p>
        </div>

        <div className="relative">
          <div className="absolute left-1/2 top-4 bottom-4 w-1 bg-gray-200 rounded-full -translate-x-1/2" aria-hidden="true" />
          <div className="space-y-16">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                className="relative flex items-center"
                initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex-1">
                  <div className={`p-6 bg-gray-50 rounded-xl shadow-md border border-gray-100 ${i % 2 === 0 ? 'text-right' : 'text-left'}`}>
                    <h3 className="text-xl font-bold text-red-600">{step.title}</h3>
                    <p className="mt-2 text-gray-600">{step.description}</p>
                  </div>
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 z-10">
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg">
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
    <section className="bg-gradient-to-r from-red-600 to-pink-500">
      <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 sm:py-24 lg:px-8 text-center text-white">
        <h2 className="text-3xl font-extrabold sm:text-4xl">Supercharge Your Workflow</h2>
        <p className="mt-4 text-lg leading-6 opacity-80">
          Stop wasting time. Start getting answers. Try VidQuery for free today.
        </p>
        <motion.a
          href="/use"
          whileHover={{ scale: 1.05, boxShadow: "0px 10px 30px rgba(255,255,255,0.4)" }}
          whileTap={{ scale: 0.95 }}
          className="mt-8 inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-full text-red-600 bg-white hover:bg-gray-100 shadow-lg transition"
        >
          Get Started - It's Free
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
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8 flex justify-center text-gray-500">
        &copy; {new Date().getFullYear()} VidQuery. All rights reserved.
      </div>
    </footer>
  )
}














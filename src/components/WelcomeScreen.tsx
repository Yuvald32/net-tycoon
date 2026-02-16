import { useState, useEffect, useRef } from 'react'
import { useNetworkStore } from '../stores/networkStore'

const BOOT_LINES = [
  '> Initializing network stack...',
  '> Loading CCNA modules...',
  '> Configuring virtual interfaces...',
  '> System ready.',
  '',
]

const TOPICS = [
  'Network Fundamentals (OSI, TCP/IP)',
  'Subnetting & Addressing',
  'Routing & Switching Protocols',
  'Network Security & Automation',
]

function useTypewriter(lines: string[], charDelay = 25, lineDelay = 200) {
  const [displayed, setDisplayed] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const skippedRef = useRef(false)

  function skip() {
    skippedRef.current = true
    setDisplayed(lines)
    setDone(true)
  }

  useEffect(() => {
    let lineIdx = 0
    let charIdx = 0
    const buf: string[] = []

    function tick() {
      if (skippedRef.current) return

      if (lineIdx >= lines.length) {
        setDone(true)
        return
      }

      const line = lines[lineIdx]

      if (charIdx <= line.length) {
        buf[lineIdx] = line.slice(0, charIdx)
        setDisplayed([...buf])
        charIdx++
        setTimeout(tick, charDelay)
      } else {
        lineIdx++
        charIdx = 0
        setTimeout(tick, lineDelay)
      }
    }

    tick()
  }, [lines, charDelay, lineDelay])

  return { displayed, done, skip }
}

export function WelcomeScreen() {
  const startLevel = useNetworkStore((s) => s.startLevel)
  const { displayed, done, skip } = useTypewriter(BOOT_LINES, 20, 150)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (done) {
      const t = setTimeout(() => setShowContent(true), 200)
      return () => clearTimeout(t)
    }
  }, [done])

  return (
    <div
      className="absolute inset-0 z-[200] flex items-center justify-center overflow-hidden"
      onClick={() => { if (!done) skip() }}
    >
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(34,197,94,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Scanline effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
        }}
      />

      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(34,197,94,0.04) 0%, rgba(3,7,18,1) 70%)',
        }}
      />

      <div className="relative max-w-lg w-full mx-4 text-center z-10">
        {/* Boot sequence */}
        {!showContent && (
          <div className="text-left font-mono text-sm mb-6 min-h-[140px]">
            {displayed.map((line, i) => (
              <p key={i} className="text-green-500/70 leading-relaxed">
                {line}
                {i === displayed.length - 1 && !done && (
                  <span className="inline-block w-2 h-4 bg-green-400 ml-0.5 animate-pulse align-middle" />
                )}
              </p>
            ))}
          </div>
        )}

        {/* Main content — fades in after boot */}
        <div
          className={`transition-all duration-700 ${
            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <h1 className="text-5xl font-bold font-mono text-green-400 mb-3 tracking-widest">
            NET TYCOON
          </h1>
          <p className="text-gray-500 font-mono text-sm mb-10">
            Master CCNA. Build the Internet.
          </p>

          <div className="bg-gray-900/80 border border-gray-800 rounded-lg p-6 mb-10 text-left backdrop-blur-sm">
            <p className="text-gray-600 font-mono text-xs mb-4 uppercase tracking-wider">
              // What you will learn
            </p>
            <ul className="space-y-2">
              {TOPICS.map((topic, i) => (
                <li
                  key={topic}
                  className="flex items-start gap-3 font-mono text-sm"
                  style={{
                    animation: showContent ? `fadeSlideIn 0.4s ease ${i * 0.1}s both` : 'none',
                  }}
                >
                  <span className="text-green-600 mt-0.5">{'>'}</span>
                  <span className="text-gray-300">{topic}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => startLevel(1)}
            className="px-8 py-3 rounded-lg font-mono text-sm font-bold bg-green-600 hover:bg-green-500 text-white tracking-wider transition-colors cursor-pointer shadow-lg shadow-green-900/30"
          >
            INITIALIZE SYSTEM
          </button>
        </div>
      </div>
    </div>
  )
}

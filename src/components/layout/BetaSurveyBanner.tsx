'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, X } from 'lucide-react'
import Link from 'next/link'

const BANNER_DISMISS_KEY = 'mizan_beta_survey_dismissed'
const DISMISS_DURATION_MS = 3 * 24 * 60 * 60 * 1000 // 3 days

export function BetaSurveyBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(BANNER_DISMISS_KEY)
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10)
      if (Date.now() - dismissedAt < DISMISS_DURATION_MS) return
    }
    setVisible(true)
  }, [])

  const handleDismiss = () => {
    localStorage.setItem(BANNER_DISMISS_KEY, Date.now().toString())
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="bg-gradient-to-l from-amber-500/90 to-amber-600/90 text-white px-4 py-3 flex items-center justify-between gap-3 z-[100] shadow-sm animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <MessageSquare size={18} className="shrink-0" />
        <p className="text-sm font-medium truncate">
          <span className="font-bold">ساعدنا نطوّر ميزان!</span>
          {' '}
          شاركنا رأيك في استبيان سريع (دقيقتين فقط) لنبني المنصة التي تناسبك.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/#feedback"
          target="_blank"
          className="px-4 py-1.5 bg-white text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-50 transition-colors"
        >
          املأ الاستبيان
        </Link>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-white/20 rounded-md transition-colors cursor-pointer"
          aria-label="إغلاق"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

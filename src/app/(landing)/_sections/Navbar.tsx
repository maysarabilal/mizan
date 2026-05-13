'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { label: 'المميزات', href: '#features' },
    { label: 'لقطات الشاشة', href: '#screenshots' },
    { label: 'الأسعار', href: '#pricing' },
    { label: 'شهادات العملاء', href: '#testimonials' },
  ]

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href)
    if (element) element.scrollIntoView({ behavior: 'smooth' })
    setMobileOpen(false)
  }

  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setMobileOpen(false)
  }

  return (
    <nav className={`fixed top-0 right-0 left-0 z-50 w-full transition-all duration-300 ${
      scrolled ? 'bg-l-navy/85 backdrop-blur-md shadow-l-gold' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" onClick={scrollToTop} className="flex items-center gap-4 cursor-pointer group">
            <Image 
              src="/images/mizan-logo.png" 
              alt="ميزان" 
              width={64} 
              height={64} 
              className="h-12 w-auto md:h-16 object-contain transition-transform group-hover:scale-110" 
            />
            <div className="flex flex-col">
              <span className="font-cormorant text-2xl md:text-3xl text-gradient-l-gold font-bold tracking-wide leading-none">
                MIZAN
              </span>
              <span className="text-[10px] text-l-gold/60 tracking-[0.4em] uppercase mr-1 mt-1 hidden md:block">
                Legal Management
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button key={link.href} onClick={() => scrollToSection(link.href)}
                className="text-l-text hover:text-l-gold transition-colors duration-300 text-base font-medium"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/login" className="text-l-gold-light text-base font-medium hover:text-l-gold transition-colors">
              تسجيل الدخول
            </Link>
            <Link href="/register"
              className="px-8 py-3 bg-gradient-l-gold text-l-navy rounded-lg text-base font-bold hover:scale-105 transition-all duration-300 shadow-l-gold/20 shadow-lg"
            >
              ابدأ الآن
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button className="md:hidden text-l-gold p-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={`md:hidden fixed top-0 right-0 h-full w-72 bg-l-navy border-l border-l-gold/20 transform transition-transform duration-300 ease-in-out z-50 ${
        mobileOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-2">
              <Image src="/images/mizan-logo.png" alt="ميزان" width={40} height={40} className="h-10 w-auto object-contain" />
              <span className="font-cormorant text-xl text-gradient-l-gold font-bold">MIZAN</span>
            </div>
            <button onClick={() => setMobileOpen(false)} className="text-l-gold p-1" aria-label="Close menu">
              <X size={24} />
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <button key={link.href} onClick={() => scrollToSection(link.href)}
                className="text-right text-l-text hover:text-l-gold transition-colors py-3 border-b border-l-gold/10"
              >
                {link.label}
              </button>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-4">
            <Link href="/login" className="text-center text-l-gold-light py-2 hover:text-l-gold transition-colors">تسجيل الدخول</Link>
            <Link href="/register" className="text-center px-6 py-3 bg-gradient-l-gold text-l-navy rounded-lg font-semibold">
              ابدأ الآن
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />}
    </nav>
  )
}

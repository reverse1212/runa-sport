'use client'
import { useEffect } from 'react'
import { track } from '../lib/track.js'

export default function Tracker() {
  useEffect(() => {
    track('vista_pagina')
    const onClick = (e) => {
      const a = e.target.closest('[data-log]')
      if (a) track(a.dataset.log)
    }
    document.addEventListener('click', onClick)
    let seen = false
    const io = new IntersectionObserver((en) => {
      if (!seen && en[0].isIntersecting) {
        seen = true
        track('stock_visto')
      }
    }, { threshold: 0.25 })
    const el = document.getElementById('stock')
    if (el) io.observe(el)
    return () => {
      document.removeEventListener('click', onClick)
      io.disconnect()
    }
  }, [])
  return null
}

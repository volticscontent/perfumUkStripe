import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import axios from "axios"
import { useEffect } from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Configurações dos pixels usando variáveis de ambiente NEXT_PUBLIC_ (seguras para frontend)
export const FACEBOOK_PIXEL_ID_1 = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID_1
export const FACEBOOK_PIXEL_ID_2 = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID_2
export const TIKTOK_PIXEL_ID_1 = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID_1 || 'D3094U3C77U1O98E1R50'
export const TIKTOK_PIXEL_ID_2 = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID_2
export const UTMIFY_PIXEL_ID = process.env.NEXT_PUBLIC_UTMIFY_PIXEL_ID

// Controle global de eventos já disparados
const trackedEvents = new Set<string>()

export function trackEvent(eventName: string, parameters?: Record<string, any>, options?: Record<string, any>, allowDuplicates: boolean = true) {
  // Se o evento já foi disparado e não permite duplicatas, não dispara novamente
  if (!allowDuplicates && trackedEvents.has(eventName)) {
    console.log(`[Pixel Tracking] Event already tracked:`, eventName)
    return
  }

  if (typeof window !== 'undefined') {
    // Facebook Pixels usando track simples
    if ((window as any).fbq) {
      try {
        if (options && Object.keys(options).length > 0) {
          (window as any).fbq('track', eventName, parameters, options)
        } else {
          (window as any).fbq('track', eventName, parameters)
        }
        console.log(`[Meta Pixels] Tracked event:`, eventName, parameters, options)
      } catch (error) {
        console.error('[Meta Pixel] Error tracking event:', error)
      }
    }

    // TikTok Pixel 1
    if (typeof (window as any).ttq !== 'undefined' && (window as any).ttq && typeof (window as any).ttq.track === 'function' && TIKTOK_PIXEL_ID_1) {
      try {
        (window as any).ttq.track(eventName, parameters)
        console.log(`[TikTok Pixel ${TIKTOK_PIXEL_ID_1}] Tracked event:`, eventName, parameters)
      } catch (error) {
        console.error('[TikTok Pixel 1] Error tracking event:', error)
      }
    } else if (TIKTOK_PIXEL_ID_1) {
      console.warn('[TikTok Pixel 1] ttq not available or not loaded yet')
    }

    // UTMify Pixel (se disponível)
    if ((window as any).utmify && typeof (window as any).utmify.track === 'function') {
      try {
        (window as any).utmify.track(eventName, parameters)
        console.log(`[UTMify Pixel] Tracked event:`, eventName, parameters)
      } catch (error) {
        console.error('[UTMify Pixel] Error tracking event:', error)
      }
    }

    // Marca o evento como disparado
    if (!allowDuplicates) {
      trackedEvents.add(eventName)
    }
  }
}

// Função específica para rastrear steps do quiz
export function trackQuizStep(step: string, questionNumber?: number, isCorrect?: boolean) {
  const stepKey = `quiz_${step}${questionNumber ? `_${questionNumber}` : ''}`
  
  const parameters: Record<string, any> = {}
  
  if (questionNumber) {
    parameters.question_number = questionNumber
  }
  
  if (isCorrect !== undefined) {
    parameters.is_correct = isCorrect
  }
  
  // Log detalhado para debug
  console.log(`[Quiz Step Tracking] ${stepKey}:`, parameters)
  console.log(`[Pixels] Meta 1: ${FACEBOOK_PIXEL_ID_1 || 'Not configured'}, Meta 2: ${FACEBOOK_PIXEL_ID_2 || 'Not configured'}, TikTok 1: ${TIKTOK_PIXEL_ID_1 || 'Not configured'}, TikTok 2: ${TIKTOK_PIXEL_ID_2 || 'Not configured'}`)
  
  trackEvent(stepKey, parameters, undefined, false) // Não permite duplicatas por padrão
}

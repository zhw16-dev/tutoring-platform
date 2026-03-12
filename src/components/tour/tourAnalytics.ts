export function trackTourEvent(
  event: 'tour_started' | 'step_viewed' | 'tour_completed' | 'tour_skipped',
  metadata?: Record<string, string>
) {
  // Placeholder — can wire up to Vercel Analytics, Mixpanel, etc. later
  if (process.env.NODE_ENV === 'development') {
    console.log('[Tour]', event, metadata)
  }
}

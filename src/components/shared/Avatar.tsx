'use client'

import { getAvatarColor, getInitials } from '@/utils/colors'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md'
}

export default function Avatar({ name, size = 'md' }: AvatarProps) {
  const bg = getAvatarColor(name)
  const initials = getInitials(name)
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'

  return (
    <div
      className={`${sizeClass} rounded-full font-medium text-white flex items-center justify-center shrink-0`}
      style={{ backgroundColor: bg }}
    >
      {initials}
    </div>
  )
}

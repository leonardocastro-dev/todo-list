const COLORS = [
  'bg-red-500',
  'bg-rose-500',
  'bg-orange-500',
  'bg-amber-600',
  'bg-lime-600',
  'bg-green-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-cyan-600',
  'bg-sky-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-purple-500',
  'bg-fuchsia-500',
  'bg-pink-500'
]

export function getAvatarColor(uid: string): string {
  let hash = 0
  for (let i = 0; i < uid.length; i++) {
    hash = uid.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLORS[Math.abs(hash) % COLORS.length]
}

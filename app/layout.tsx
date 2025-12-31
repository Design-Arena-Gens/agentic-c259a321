import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Amity Professor Agent - AI Study Assistant',
  description: 'Your personal AI professor for Amity course materials',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

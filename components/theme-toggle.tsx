"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg border-2 z-50 bg-background hover:scale-110 transition-transform active:scale-95"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Cambiar tema"
    >
      <span className="text-2xl">
        {theme === "dark" ? "☀️" : "🌙"}
      </span>
    </Button>
  )
}

"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Cloud, CloudOff, Loader2 } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface UserMenuProps {
  user: SupabaseUser | null
  onLogin: () => void
  onLogout: () => void
}

export function UserMenu({ user, onLogin, onLogout }: UserMenuProps) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setLoading(false)
    onLogout()
  }

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Cloud className="h-4 w-4 text-green-500" />
            <span className="hidden sm:inline max-w-[120px] truncate">{user.email}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 text-sm">
            <p className="text-muted-foreground">Đã đăng nhập</p>
            <p className="font-medium truncate">{user.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            disabled={loading}
            className="text-destructive focus:text-destructive"
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogOut className="h-4 w-4 mr-2" />}
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Button variant="outline" size="sm" onClick={onLogin} className="gap-2 bg-transparent">
      <CloudOff className="h-4 w-4 text-muted-foreground" />
      <span className="hidden sm:inline">Guest</span>
      <User className="h-4 w-4 sm:hidden" />
    </Button>
  )
}

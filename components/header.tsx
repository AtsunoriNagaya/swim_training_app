import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { FishIcon as Swim } from "lucide-react"

export default function Header() {
  return (
    <header className="relative border-b bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10 backdrop-blur-sm">
      <div className="absolute inset-0 bg-wave-pattern opacity-10 animate-wave"></div>
      <div className="container flex h-20 items-center justify-between px-4 relative z-10">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white overflow-hidden group-hover:scale-110 transition-transform duration-300">
            <Swim className="h-6 w-6 animate-float" />
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          <div>
            <span className="text-xl font-bold gradient-text">水泳部メニュー作成</span>
            <div className="h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"></div>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/create" className="text-sm font-medium relative group">
            <span>メニュー作成</span>
            <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></div>
          </Link>
          <Link href="/upload" className="text-sm font-medium relative group">
            <span>過去メニュー管理</span>
            <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></div>
          </Link>
          <Link href="/history" className="text-sm font-medium relative group">
            <span>メニュー履歴</span>
            <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></div>
          </Link>
          <Link href="/help" className="text-sm font-medium relative group">
            <span>ヘルプ</span>
            <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></div>
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <ModeToggle />
          <Link href="/create">
            <Button className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
              新規メニュー作成
            </Button>
          </Link>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent"></div>
    </header>
  )
}


import Link from "next/link"
import { Waves } from "lucide-react"

export default function Footer() {
  return (
    <footer className="relative border-t mt-16">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-secondary to-primary"></div>
      <div className="absolute inset-0 bg-wave-pattern opacity-10"></div>
      <div className="wave-bg pt-12 pb-8 relative z-10">
        <div className="container flex flex-col items-center justify-between gap-8 md:flex-row px-4">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white">
                <Waves className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold gradient-text">水泳部メニュー作成</span>
            </div>
            <p className="text-center text-sm text-muted-foreground md:text-left max-w-xs">
              AIを活用して効率的に水泳部の練習メニューを作成するアプリケーション
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm">
            <div className="flex flex-col space-y-3">
              <h3 className="font-medium text-foreground">機能</h3>
              <Link href="/create" className="text-muted-foreground hover:text-primary transition-colors">
                メニュー作成
              </Link>
              <Link href="/upload" className="text-muted-foreground hover:text-primary transition-colors">
                過去メニュー管理
              </Link>
              <Link href="/history" className="text-muted-foreground hover:text-primary transition-colors">
                メニュー履歴
              </Link>
            </div>
            <div className="flex flex-col space-y-3">
              <h3 className="font-medium text-foreground">情報</h3>
              <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                アプリについて
              </Link>
              <Link href="/help" className="text-muted-foreground hover:text-primary transition-colors">
                ヘルプ
              </Link>
              <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                利用規約
              </Link>
              <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                プライバシーポリシー
              </Link>
            </div>
          </div>
        </div>

        <div className="container mt-8 pt-8 border-t px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-center text-sm text-muted-foreground md:text-left">
              &copy; {new Date().getFullYear()} 水泳部練習メニュー作成アプリ
            </p>
            <div className="flex gap-4">
              <a href="https://github.com/AtsunoriNagaya/swim_training_app" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary" aria-label="GitHub リポジトリを新規タブで開く">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-twitter"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
                <span className="sr-only">Twitter</span>
              </a>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-instagram"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-github"
                >
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
                <span className="sr-only">GitHub</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

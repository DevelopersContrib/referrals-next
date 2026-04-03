import Link from "next/link";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold text-blue-600">
            Referrals.com
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/how-it-works"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              How It Works
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Pricing
            </Link>
            <Link
              href="/developer"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Developers
            </Link>
            <Link
              href="/blog"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Blog
            </Link>
            <Link
              href="/contact"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Contact
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/signin"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Product</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/how-it-works" className="text-sm text-gray-600 hover:text-gray-900">How It Works</Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</Link>
                </li>
                <li>
                  <Link href="/developer" className="text-sm text-gray-600 hover:text-gray-900">Developers</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Company</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/about" className="text-sm text-gray-600 hover:text-gray-900">About</Link>
                </li>
                <li>
                  <Link href="/blog" className="text-sm text-gray-600 hover:text-gray-900">Blog</Link>
                </li>
                <li>
                  <Link href="/contact" className="text-sm text-gray-600 hover:text-gray-900">Contact</Link>
                </li>
                <li>
                  <Link href="/referral-program" className="text-sm text-gray-600 hover:text-gray-900">Referral Program</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Legal</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900">Privacy</Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900">Terms</Link>
                </li>
                <li>
                  <Link href="/cookie-policy" className="text-sm text-gray-600 hover:text-gray-900">Cookie Policy</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Referrals.com. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

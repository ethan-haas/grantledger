import Link from "next/link";

export function MarketingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-neutral-950">
      {/* Gradient separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary-600/20 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-600">
                <span className="text-sm font-bold text-white">GL</span>
              </div>
              <span className="text-xl font-bold font-display tracking-tight text-white">
                GrantLedger
              </span>
            </Link>
            <p className="mt-3 text-sm text-neutral-400">
              AI-powered federal grant expense categorization for nonprofit finance directors.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Product
            </h3>
            <ul className="mt-4 space-y-3">
              {[
                { href: "/pricing", label: "Pricing" },
                { href: "/integrations", label: "Integrations" },
                { href: "/methodology", label: "Methodology" },
                { href: "/changelog", label: "Changelog" },
                { href: "/sign-up", label: "Start Free Trial" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-400 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Resources
            </h3>
            <ul className="mt-4 space-y-3">
              {[
                { href: "/blog", label: "Blog" },
                { href: "/resources", label: "Resources" },
                { href: "/case-studies", label: "Case Studies" },
                { href: "/methodology", label: "2 CFR 200 Guide" },
                { href: "/sign-in", label: "Sign In" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-400 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Company
            </h3>
            <ul className="mt-4 space-y-3">
              {[
                { href: "/about", label: "About" },
                { href: "/contact", label: "Contact" },
                { href: "/security", label: "Security" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-400 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Legal
            </h3>
            <ul className="mt-4 space-y-3">
              {[
                { href: "/privacy", label: "Privacy Policy" },
                { href: "/terms", label: "Terms of Service" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-400 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-neutral-800 pt-8">
          <p className="text-sm text-neutral-400">
            &copy; {currentYear} GrantLedger. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

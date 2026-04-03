import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Learn about how Referrals.com uses cookies and similar technologies.",
  openGraph: {
    title: "Cookie Policy | Referrals.com",
    description:
      "Learn about how Referrals.com uses cookies and similar technologies.",
    url: "https://referrals.com/cookie-policy",
    siteName: "Referrals.com",
    images: [{ url: "/images/logo/logo.png", width: 284, height: 90 }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Cookie Policy | Referrals.com",
    description:
      "Learn about how Referrals.com uses cookies and similar technologies.",
  },
};

export default function CookiePolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900">
        Cookie Policy
      </h1>
      <p className="mt-2 text-sm text-gray-500">Last updated: April 1, 2026</p>

      <div className="prose mt-8 max-w-none text-gray-600 space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-gray-900">What Are Cookies</h2>
          <p>Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences, track activity, and provide a better user experience. Referrals.com uses cookies and similar technologies to operate and improve our platform.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">How We Use Cookies</h2>
          <div className="mt-4 space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">Essential Cookies</h3>
              <p>Required for the platform to function. These handle authentication, session management, and security. They cannot be disabled.</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Analytics Cookies</h3>
              <p>Help us understand how visitors interact with our platform so we can improve the experience. These collect anonymized usage data such as pages visited and time spent on site.</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Functional Cookies</h3>
              <p>Remember your preferences (like language and display settings) to provide a personalized experience across sessions.</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Referral Tracking Cookies</h3>
              <p>Used to track referral activity across campaigns. These cookies attribute signups, shares, and clicks to the correct referral sources so that rewards can be distributed accurately.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">Third-Party Cookies</h2>
          <p>Some cookies are placed by third-party services we use, such as analytics providers and payment processors. These third parties have their own privacy and cookie policies.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">Managing Cookies</h2>
          <p>You can control and manage cookies through your browser settings. Most browsers allow you to refuse or delete cookies. Note that disabling essential cookies may prevent parts of the platform from functioning correctly.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">Changes to This Policy</h2>
          <p>We may update this Cookie Policy from time to time. Changes will be posted on this page with an updated date. Continued use of our services after changes constitutes acceptance.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">Contact Us</h2>
          <p>If you have questions about our use of cookies, contact us at privacy@referrals.com.</p>
        </section>
      </div>
    </div>
  );
}

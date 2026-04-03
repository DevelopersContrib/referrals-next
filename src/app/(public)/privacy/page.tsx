import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Referrals.com privacy policy. Learn how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-gray-500">Last updated: April 1, 2026</p>

      <div className="prose mt-8 max-w-none text-gray-600 space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-gray-900">1. Information We Collect</h2>
          <p>We collect information you provide directly to us, such as when you create an account, set up a campaign, or contact support. This includes your name, email address, website URL, and payment information. We also collect usage data automatically, including IP addresses, browser type, pages visited, and referral sources.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">2. How We Use Your Information</h2>
          <p>We use the information we collect to provide, maintain, and improve our services, process transactions, send transactional emails, respond to support requests, and monitor usage patterns to improve user experience. We may also use aggregated, anonymized data for analytics and marketing purposes.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">3. Information Sharing</h2>
          <p>We do not sell your personal information. We may share information with third-party service providers who help us operate our platform (such as payment processors, email delivery services, and hosting providers). We may also disclose information when required by law or to protect our rights.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">4. Data Security</h2>
          <p>We implement industry-standard security measures to protect your data, including encryption in transit and at rest, access controls, and regular security audits. However, no method of transmission over the Internet is completely secure, and we cannot guarantee absolute security.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">5. Cookies and Tracking</h2>
          <p>We use cookies and similar technologies to remember your preferences, track referral activity, and analyze usage. You can manage cookie preferences through your browser settings. See our Cookie Policy for more details.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">6. Data Retention</h2>
          <p>We retain your personal data for as long as your account is active or as needed to provide services. When you delete your account, we will remove your personal data within 30 days, except where retention is required by law.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">7. Your Rights</h2>
          <p>Depending on your jurisdiction, you may have the right to access, correct, delete, or export your personal data. You may also have the right to object to or restrict certain processing activities. To exercise these rights, contact us at privacy@referrals.com.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">8. Children&apos;s Privacy</h2>
          <p>Our services are not directed to individuals under the age of 16. We do not knowingly collect personal information from children. If we learn that we have collected data from a child, we will delete it promptly.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">9. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the date above. Your continued use of our services after changes constitutes acceptance of the updated policy.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">10. Contact Us</h2>
          <p>If you have questions about this Privacy Policy, please contact us at privacy@referrals.com.</p>
        </section>
      </div>
    </div>
  );
}

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Read the Referrals.com terms of service and acceptable use policy.",
  openGraph: {
    title: "Terms of Service | Referrals.com",
    description:
      "Read the Referrals.com terms of service and acceptable use policy.",
    url: "https://referrals.com/terms",
    siteName: "Referrals.com",
    images: [{ url: "/images/logo/logo.png", width: 284, height: 90 }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Terms of Service | Referrals.com",
    description:
      "Read the Referrals.com terms of service and acceptable use policy.",
  },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-gray-500">Last updated: April 1, 2026</p>

      <div className="prose mt-8 max-w-none text-gray-600 space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-gray-900">1. Acceptance of Terms</h2>
          <p>By accessing or using Referrals.com, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use our services. These terms apply to all visitors, users, and others who access the platform.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">2. Description of Service</h2>
          <p>Referrals.com provides a referral marketing platform that allows users to create referral campaigns, embed widgets on their websites, track referral activity, and reward participants. We reserve the right to modify, suspend, or discontinue any aspect of the service at any time.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">3. User Accounts</h2>
          <p>You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must notify us immediately of any unauthorized use.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">4. Acceptable Use</h2>
          <p>You agree not to use Referrals.com to send spam, promote illegal activities, infringe on intellectual property rights, distribute malware, or engage in any activity that violates applicable laws. We reserve the right to suspend or terminate accounts that violate these terms.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">5. Payment and Billing</h2>
          <p>Paid plans are billed in advance on a monthly or annual basis. All fees are non-refundable except as required by law. We may change pricing with 30 days notice. Failure to pay may result in suspension or termination of your account.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">6. Intellectual Property</h2>
          <p>Referrals.com and its original content, features, and functionality are owned by Referrals.com and are protected by international copyright, trademark, and other intellectual property laws. You retain ownership of your content but grant us a license to use it in connection with providing our services.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">7. Limitation of Liability</h2>
          <p>To the fullest extent permitted by law, Referrals.com shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service. Our total liability shall not exceed the amount you have paid us in the twelve months preceding the claim.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">8. Disclaimer of Warranties</h2>
          <p>Our service is provided on an &quot;as is&quot; and &quot;as available&quot; basis without warranties of any kind, either express or implied. We do not guarantee that the service will be uninterrupted, secure, or error-free.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">9. Termination</h2>
          <p>We may terminate or suspend your account at any time for violations of these terms. You may terminate your account at any time by contacting support. Upon termination, your right to use the service ceases immediately.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">10. Governing Law</h2>
          <p>These terms shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law principles. Any disputes will be resolved in the courts of the applicable jurisdiction.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">11. Contact</h2>
          <p>If you have questions about these Terms of Service, please contact us at legal@referrals.com.</p>
        </section>
      </div>
    </div>
  );
}

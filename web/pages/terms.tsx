import Head from 'next/head';
import Link from 'next/link';

export default function Terms() {
  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Terms of Service | Agent Resources</title>
        <meta name="description" content="Terms of Service for Agent Resources marketplace" />
      </Head>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-semibold text-slate-900 mb-4">Terms of Service</h1>
          <p className="text-slate-500 mb-12">Last updated: March 28, 2026</p>

          <div className="prose prose-slate max-w-none">
            <p className="text-lg text-slate-600 mb-8">
              These terms govern your use of Agent Resources, operated by Agent Resources LLC ("we," "us," "our").
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-slate-600">
                By accessing or using Agent Resources, you agree to be bound by these Terms of Service. 
                If you do not agree, do not use the platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. The Platform</h2>
              <p className="text-slate-600">
                Agent Resources is a marketplace that connects buyers with independent creators who publish 
                AI personas, skills, MCP servers, and related digital goods ("Listings"). We provide the 
                infrastructure; creators provide the content.
              </p>
              <p className="text-slate-600 mt-4">
                We are not the creator, author, or publisher of any Listing. Creators are solely responsible 
                for their Listings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. Purchases</h2>
              
              <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">3.1 Digital Goods</h3>
              <p className="text-slate-600">
                Listings are digital goods delivered electronically. All purchases are final and non-refundable 
                except where required by applicable law.
              </p>

              <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">3.2 License</h3>
              <p className="text-slate-600">
                Purchases grant a personal-use license to the buyer. Redistribution, resale, sublicensing, 
                or public reposting of purchased files is not permitted.
              </p>

              <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">3.3 Pricing and Payment</h3>
              <ul className="list-disc list-inside text-slate-600 space-y-2">
                <li>Prices are set by creators</li>
                <li>We collect payment on behalf of creators</li>
                <li>We remit creator share after deducting platform commission and payment processing fees</li>
                <li>No commission for free listings</li>
                <li>Standard commission: 15% (free items: 0%)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Accounts</h2>
              
              <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">4.1 Security</h3>
              <p className="text-slate-600">You are responsible for maintaining the security of your account credentials.</p>

              <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">4.2 Accuracy</h3>
              <p className="text-slate-600">You must provide accurate account information.</p>

              <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">4.3 Termination</h3>
              <p className="text-slate-600">
                Accounts involved in abuse, fraud, or policy violations may be suspended or terminated 
                without notice.
              </p>

              <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">4.4 Restrictions</h3>
              <p className="text-slate-600">
                You may not create multiple accounts to circumvent restrictions or manipulate the platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Listings and Content</h2>
              
              <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">5.1 Creator Responsibilities</h3>
              <p className="text-slate-600">Creators are solely responsible for:</p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 mt-2">
                <li>The accuracy and quality of their Listings</li>
                <li>Ensuring they have rights to publish the content</li>
                <li>Providing support for their Listings</li>
                <li>Maintaining and updating their Listings</li>
              </ul>

              <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">5.2 Prohibited Content</h3>
              <p className="text-slate-600">Listings may not contain:</p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 mt-2">
                <li>Malicious code, malware, or harmful software</li>
                <li>Stolen or infringing content</li>
                <li>False or misleading claims</li>
                <li>Illegal content or activities</li>
                <li>Hate speech or harassment</li>
              </ul>

              <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">5.3 Security Verification</h3>
              <p className="text-slate-600">
                We may conduct automated security checks on Listings. A security report may be displayed, 
                but this does not constitute a guarantee of safety or functionality.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Security Reports</h2>
              
              <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">6.1 Automated Checks</h3>
              <p className="text-slate-600">We run automated security checks including:</p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 mt-2">
                <li>Malicious code scanning</li>
                <li>Dependency vulnerability checks</li>
                <li>Secrets detection</li>
                <li>Sandbox execution testing</li>
              </ul>

              <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">6.2 Disclaimer</h3>
              <p className="text-slate-600">Security reports are provided for informational purposes only. We do not guarantee:</p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 mt-2">
                <li>Complete detection of all security issues</li>
                <li>Future security of the Listing</li>
                <li>Fitness for any particular purpose</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Third-Party Content Disclaimer</h2>
              <p className="text-slate-600">
                All Listings are created and published by independent third-party creators. We do not review, 
                endorse, verify, or guarantee any Listing. We are not responsible for:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 mt-4">
                <li>The accuracy, quality, safety, legality, or functionality of any Listing</li>
                <li>Any damages, losses, or harm resulting from the use of any Listing</li>
                <li>Any intellectual property infringement by a creator</li>
                <li>Any interactions, agreements, or disputes between buyers and creators</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">8. Dispute Resolution</h2>
              
              <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">8.1 Between Users</h3>
              <p className="text-slate-600">
                We do not mediate disputes between buyers and creators. Users are encouraged to resolve 
                disputes directly.
              </p>

              <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">8.2 Reporting</h3>
              <p className="text-slate-600">
                If you believe a Listing violates our policies or your rights, please contact us at{' '}
                <a href="mailto:support@shopagentresources.com" className="text-blue-600 hover:underline">
                  support@shopagentresources.com
                </a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">9. Disclaimer of Warranties</h2>
              <p className="text-slate-600 font-medium uppercase tracking-wide">
                The platform and all listings are provided "as is" and "as available" without warranties 
                of any kind, whether express, implied, statutory, or otherwise.
              </p>
              <p className="text-slate-600 mt-4">
                We expressly disclaim all implied warranties of merchantability, fitness for a particular 
                purpose, title, and non-infringement.
              </p>
              <p className="text-slate-600 mt-4">We do not warrant that:</p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 mt-2">
                <li>The platform will be uninterrupted, error-free, or secure</li>
                <li>Any Listing will meet your expectations or requirements</li>
                <li>Security reports are complete or accurate</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">10. Limitation of Liability</h2>
              <p className="text-slate-600 font-medium uppercase tracking-wide">
                To the maximum extent permitted by law, Agent Resources LLC, its officers, directors, 
                employees, and agents shall not be liable for any indirect, incidental, special, 
                consequential, or punitive damages, or any loss of profits, revenue, data, or goodwill, 
                arising out of or related to your use of the platform or any listing.
              </p>
              <p className="text-slate-600 mt-4 font-semibold">
                Our total aggregate liability for any claims arising out of or related to these terms 
                or the platform shall not exceed the greater of (a) the amount you paid us in the 
                12 months preceding the claim, or (b) $100 USD.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">11. Indemnification</h2>
              <p className="text-slate-600">
                You agree to indemnify and hold harmless Agent Resources LLC and its officers, directors, 
                employees, and agents from any claims, damages, losses, liabilities, and expenses 
                (including reasonable attorney's fees) arising out of or related to: (a) your use of 
                the platform; (b) your violation of these Terms; (c) any Listing you create or publish; 
                or (d) your violation of any third-party rights.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">12. Prohibited Conduct</h2>
              <p className="text-slate-600">You may not:</p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 mt-2">
                <li>Upload malicious code, harmful payloads, or content designed to damage systems or data</li>
                <li>Impersonate real people, brands, or organizations without authorization</li>
                <li>Publish stolen, plagiarized, or unlicensed content</li>
                <li>Attempt to circumvent platform security, payment systems, or access controls</li>
                <li>Use the platform for any illegal purpose</li>
                <li>Manipulate reviews, ratings, or download counts</li>
                <li>Create multiple accounts to circumvent restrictions</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">13. Termination</h2>
              <p className="text-slate-600">
                We may suspend or terminate your account at any time, with or without cause, with or 
                without notice. Upon termination, your right to use the platform ceases immediately. 
                Sections 8 through 11 survive termination.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">14. Modifications</h2>
              <p className="text-slate-600">
                We may update these Terms at any time. Material changes will be communicated via the 
                platform or email. Continued use after changes constitutes acceptance.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">15. Governing Law</h2>
              <p className="text-slate-600">
                These Terms are governed by and construed in accordance with the laws of the State 
                of California, without regard to conflict of law principles. Any disputes shall be 
                resolved in the state or federal courts located in California.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">16. Contact</h2>
              <p className="text-slate-600">
                For questions about these terms, contact us at:
              </p>
              <p className="text-slate-600 mt-2">
                Email:{' '}
                <a href="mailto:support@shopagentresources.com" className="text-blue-600 hover:underline">
                  support@shopagentresources.com
                </a>
              </p>
            </section>

            <div className="mt-12 pt-8 border-t border-slate-200">
              <p className="text-slate-600">
                By using Agent Resources, you acknowledge that you have read, understood, and agree to 
                be bound by these Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-200">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AR</span>
            </div>
            <span className="font-semibold text-slate-900">Agent Resources</span>
          </Link>
          <div className="flex items-center gap-6 text-slate-600">
            <Link href="/terms" className="hover:text-slate-900">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-900">Privacy</Link>
            <a href="mailto:support@shopagentresources.com" className="hover:text-slate-900">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

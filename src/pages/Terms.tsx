import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const sections = [
  {
    title: 'Acceptance of Terms',
    content: [
      {
        heading: 'Agreement',
        text: 'By accessing or using the Hamaash platform — whether as a guest or registered user — you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please discontinue use of the platform immediately.',
      },
      {
        heading: 'Changes to Terms',
        text: 'We reserve the right to update or modify these terms at any time. Changes take effect as soon as they are posted. Continued use of the platform after changes are published constitutes your acceptance of the revised terms.',
      },
    ],
  },
  {
    title: 'Use of the Platform',
    content: [
      {
        heading: 'Eligibility',
        text: 'You must be at least 18 years old to place orders on Hamaash. By using this platform, you confirm that you meet this requirement and that all information you provide is accurate and up to date.',
      },
      {
        heading: 'Account Responsibility',
        text: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorised use.',
      },
      {
        heading: 'Prohibited Conduct',
        text: 'You agree not to use the platform for any unlawful purpose, to impersonate others, to submit false or misleading information, to interfere with the platform\'s operation, or to attempt unauthorised access to any part of our systems.',
      },
    ],
  },
  {
    title: 'Products & Pricing',
    content: [
      {
        heading: 'Product Availability',
        text: 'All products listed on Hamaash are subject to availability. We reserve the right to limit quantities, discontinue products, or refuse orders at our sole discretion without prior notice.',
      },
      {
        heading: 'Pricing',
        text: 'Prices are displayed in Pakistani Rupees (PKR) and are subject to change without notice. We make every effort to ensure pricing accuracy; however, in the event of a pricing error, we reserve the right to cancel the affected order and notify you accordingly.',
      },
      {
        heading: 'Wholesale & Bulk Orders',
        text: 'Bulk order discounts or wholesale rates may apply under specific conditions. Contact our team for bulk pricing inquiries. Hamaash reserves the right to verify the legitimacy of bulk purchases.',
      },
    ],
  },
  {
    title: 'Orders & Payments',
    content: [
      {
        heading: 'Order Confirmation',
        text: 'An order is confirmed only after successful payment verification and our acceptance. We reserve the right to cancel any order before dispatch, in which case a full refund will be issued.',
      },
      {
        heading: 'Payment Methods',
        text: 'We accept payments via bank transfer, mobile wallets, and cash on delivery (where available). All transactions must be completed through the payment methods listed on the checkout page.',
      },
      {
        heading: 'Order Cancellation',
        text: 'Orders may be cancelled before they are dispatched. Once an order has been shipped, it cannot be cancelled. Please contact us as soon as possible if you need to cancel an order.',
      },
    ],
  },
  {
    title: 'Delivery',
    content: [
      {
        heading: 'Delivery Areas',
        text: 'Hamaash delivers nationwide across Pakistan. Delivery timeframes vary by location and are estimates only — delays may occur due to unforeseen circumstances such as logistics disruptions or weather conditions.',
      },
      {
        heading: 'Delivery Charges',
        text: 'Delivery charges are calculated at checkout based on your location and order value. Orders above a certain threshold may qualify for free delivery as indicated on the platform.',
      },
      {
        heading: 'Risk of Loss',
        text: 'Risk of loss and title for products pass to you upon delivery to the carrier. Hamaash is not responsible for delays or losses caused by third-party courier services once goods have been dispatched.',
      },
    ],
  },
  {
    title: 'Returns & Refunds',
    content: [
      {
        heading: 'Return Eligibility',
        text: 'Products may be returned within 7 days of delivery if they are defective, damaged, or significantly different from what was described. Items must be unused and in original packaging.',
      },
      {
        heading: 'Non-Returnable Items',
        text: 'Certain items including perishables, consumables, and products marked as final sale are not eligible for return. This will be clearly indicated on the product page.',
      },
      {
        heading: 'Refund Process',
        text: 'Approved refunds will be processed within 5–10 business days via the original payment method. Hamaash reserves the right to inspect returned items before issuing any refund.',
      },
    ],
  },
  {
    title: 'Intellectual Property',
    content: [
      {
        heading: 'Ownership',
        text: 'All content on the Hamaash platform — including text, images, logos, graphics, and software — is the property of Hamaash or its licensors and is protected by applicable intellectual property laws.',
      },
      {
        heading: 'Restrictions',
        text: 'You may not reproduce, distribute, modify, create derivative works from, or publicly display any content from the platform without prior written permission from Hamaash.',
      },
    ],
  },
  {
    title: 'Limitation of Liability',
    content: [
      {
        heading: 'Disclaimer',
        text: 'The platform is provided on an "as is" basis without warranties of any kind. Hamaash does not guarantee that the platform will be error-free, uninterrupted, or free of viruses or harmful components.',
      },
      {
        heading: 'Liability Cap',
        text: 'To the maximum extent permitted by law, Hamaash\'s total liability to you for any claim arising from the use of the platform shall not exceed the amount you paid for the specific order giving rise to the claim.',
      },
    ],
  },
  {
    title: 'Governing Law',
    content: [
      {
        heading: 'Jurisdiction',
        text: 'These Terms of Service are governed by and construed in accordance with the laws of Pakistan. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts of Pakistan.',
      },
    ],
  },
  {
    title: 'Contact Us',
    content: [
      {
        heading: 'Questions',
        text: 'If you have any questions about these Terms of Service, please contact us through our Contact page. We are happy to clarify any aspect of our policies.',
      },
    ],
  },
];

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#fffdfc] selection:bg-[#d9e7e3]">
      <Header />

      <main className="flex-1 pt-20 md:pt-28 lg:pt-36">

        {/* Hero */}
        <section className="border-b border-[#e8e3e5] pb-12 pt-10 md:pb-16 md:pt-14">
          <div className="mx-auto max-w-[900px] px-5 md:px-8">
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#186049]"
            >
              Legal
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.06 }}
              className="font-serif text-4xl leading-tight text-[#242024] md:text-5xl"
            >
              Terms of Service
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="mt-4 text-sm text-[#9a9298]"
            >
              Effective date: 1 January 2025 &nbsp;·&nbsp; Last updated: 18 October 2026
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18 }}
              className="mt-5 max-w-2xl text-sm leading-relaxed text-[#777077]"
            >
              Please read these Terms of Service carefully before using the Hamaash platform. These
              terms govern your access to and use of our website and services.
            </motion.p>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-[900px] px-5 md:px-8">

            {/* Quick nav */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="mb-12 bg-[#f4f0ed] p-5 md:p-6"
            >
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#242024]">
                Sections
              </p>
              <ol className="grid gap-1.5 sm:grid-cols-2 text-sm text-[#5f595d]">
                {sections.map((s, i) => (
                  <li key={s.title} className="flex items-start gap-2">
                    <span className="shrink-0 text-[#186049]">{String(i + 1).padStart(2, '0')}.</span>
                    <span>{s.title}</span>
                  </li>
                ))}
              </ol>
            </motion.div>

            <div className="space-y-12">
              {sections.map((section, si) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: si * 0.03 }}
                >
                  <h2 className="mb-5 font-serif text-2xl text-[#242024] md:text-3xl">
                    {si + 1}. {section.title}
                  </h2>
                  <div className="space-y-5">
                    {section.content.map((item) => (
                      <div key={item.heading} className="border-l-2 border-[#e3f0ea] pl-5">
                        <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#186049]">
                          {item.heading}
                        </h3>
                        <p className="text-sm leading-relaxed text-[#5f595d]">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer nav */}
            <div className="mt-16 flex flex-wrap items-center gap-4 border-t border-[#e8e3e5] pt-8 text-sm text-[#777077]">
              <span>Also read:</span>
              <Link to="/privacy" className="font-medium text-[#186049] hover:underline">
                Privacy Policy →
              </Link>
              <Link to="/contact" className="font-medium text-[#186049] hover:underline">
                Contact Us →
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default Terms;

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const sections = [
  {
    title: 'Information We Collect',
    content: [
      {
        heading: 'Personal Information',
        text: 'When you create an account, place an order, or contact us, we may collect your name, email address, phone number, delivery address, and payment-related information.',
      },
      {
        heading: 'Usage Data',
        text: 'We automatically collect information about how you interact with our platform — including pages visited, products viewed, search queries, browser type, device information, and IP address.',
      },
      {
        heading: 'Order Information',
        text: 'We retain records of your purchases, order history, and any communication related to your orders for customer service and operational purposes.',
      },
    ],
  },
  {
    title: 'How We Use Your Information',
    content: [
      {
        heading: 'Order Processing',
        text: 'Your personal information is used to process and fulfil your orders, send order confirmations, arrange delivery, and handle returns or refunds.',
      },
      {
        heading: 'Communication',
        text: 'We may contact you with updates about your order, respond to your queries, or send promotional offers if you have opted in. You can unsubscribe at any time.',
      },
      {
        heading: 'Platform Improvement',
        text: 'Usage data helps us understand how customers interact with Hamaash so we can improve the website, fix issues, and personalise your experience.',
      },
    ],
  },
  {
    title: 'Sharing Your Information',
    content: [
      {
        heading: 'Delivery Partners',
        text: 'We share your name, phone number, and delivery address with our logistics and courier partners solely for the purpose of delivering your orders.',
      },
      {
        heading: 'Service Providers',
        text: 'We work with trusted third-party service providers (e.g. payment processors, cloud hosting) who handle your data strictly under confidentiality agreements.',
      },
      {
        heading: 'Legal Obligations',
        text: 'We may disclose your information when required by law, regulation, court order, or to protect the rights and safety of Hamaash, its users, or the public.',
      },
    ],
  },
  {
    title: 'Data Security',
    content: [
      {
        heading: 'Protective Measures',
        text: 'We implement industry-standard security measures including encryption, secure servers, and access controls to protect your personal data against unauthorised access or disclosure.',
      },
      {
        heading: 'Your Responsibility',
        text: 'You are responsible for keeping your account credentials confidential. Please notify us immediately if you suspect unauthorised access to your account.',
      },
    ],
  },
  {
    title: 'Cookies',
    content: [
      {
        heading: 'What We Use Cookies For',
        text: 'We use cookies and similar tracking technologies to keep you signed in, remember your cart, analyse site traffic, and personalise content.',
      },
      {
        heading: 'Managing Cookies',
        text: 'You can control or disable cookies through your browser settings. Note that disabling certain cookies may affect the functionality of parts of the website.',
      },
    ],
  },
  {
    title: 'Your Rights',
    content: [
      {
        heading: 'Access & Correction',
        text: 'You have the right to access the personal information we hold about you and request corrections if any details are inaccurate or incomplete.',
      },
      {
        heading: 'Deletion',
        text: 'You may request the deletion of your account and associated personal data. We will comply unless we are required to retain certain records by law.',
      },
      {
        heading: 'Opt-Out',
        text: 'You can opt out of marketing communications at any time by clicking "unsubscribe" in any email we send, or by contacting our support team.',
      },
    ],
  },
  {
    title: 'Changes to This Policy',
    content: [
      {
        heading: 'Updates',
        text: 'We may update this Privacy Policy from time to time. Any changes will be posted on this page with a revised effective date. Continued use of the platform after changes constitutes acceptance of the updated policy.',
      },
    ],
  },
  {
    title: 'Contact Us',
    content: [
      {
        heading: 'Questions or Concerns',
        text: 'If you have any questions about this Privacy Policy or how we handle your data, please reach out to us through our Contact page. We are committed to addressing your concerns promptly.',
      },
    ],
  },
];

const Privacy = () => {
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
              Privacy Policy
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
              At Hamaash, your privacy is important to us. This policy explains what information we
              collect, how we use it, and the choices you have regarding your personal data.
            </motion.p>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-[900px] px-5 md:px-8">
            <div className="space-y-12">
              {sections.map((section, si) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: si * 0.04 }}
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
              <Link to="/terms" className="font-medium text-[#186049] hover:underline">
                Terms of Service →
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

export default Privacy;

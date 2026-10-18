import { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setIsSubmitting(true);
    
  //   // Simulate form submission
  //   await new Promise(resolve => setTimeout(resolve, 1000));
    
  //   toast.success('Message sent successfully! We\'ll get back to you soon.');
  //   setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
  //   setIsSubmitting(false);
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
  
    try {
      let sent = false;

      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: formData,
      });

      if (!error && data?.success === true) {
        sent = true;
      } else {
        const response = await fetch('/api/send-contact-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload?.success === false) {
          const details = payload?.error;
          throw new Error(
            typeof details === 'string' ? details : details?.message || 'Failed to send message'
          );
        }
        sent = true;
      }

      if (!sent) {
        throw new Error('Failed to send message');
      }

      toast.success("Message sent successfully! We'll get back to you soon.");
  
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
    } catch (error) {
      console.error(error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Phone,
      title: 'Phone',
      value: '0304 7683722',
      link: 'tel:03047683722',
    },
    {
      icon: Mail,
      title: 'Email',
      value: 'hamashk007@gmail.com',
      link: 'mailto:hamashk007@gmail.com',
    },
    {
      icon: MapPin,
      title: 'Address',
      value: 'Lahore, Pakistan',
      link: null,
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      value: '0304 7683722',
      link: 'https://wa.me/923047683722',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#fffdfc]">
      <Header />
      
      <main className="flex-1">
        <section className="border-b border-[#e8e3e5] bg-[#d9e7e3] pt-36 md:pt-40">
          <div className="mx-auto grid max-w-[1440px] gap-8 px-4 pb-12 md:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:pb-16">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#186049]">The Hamaash help desk</p>
              <h1 className="max-w-xl font-serif text-5xl leading-[0.95] text-[#242024] md:text-7xl">
                Let&apos;s make it <em className="text-[#186049]">easy.</em>
              </h1>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="max-w-md text-sm leading-relaxed text-[#5f595d] lg:justify-self-end"
            >
              Questions about an order, a product, or finding the right everyday edit? Our team is here to help.
            </motion.p>
          </div>
        </section>

        <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-8 md:py-16">
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -18 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-3"
            >
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#186049]">Reach out</p>
              <h2 className="mb-7 font-serif text-4xl text-[#242024]">
                Contact Information
              </h2>
              {contactInfo.map((item) => (
                <div key={item.title} className="border-t border-[#e8e3e5] py-4">
                    {item.link ? (
                      <a
                        href={item.link}
                        target={item.link.startsWith('http') ? '_blank' : undefined}
                        rel={item.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="flex items-center gap-4 transition-colors hover:text-[#186049]"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e3f0ea]">
                          <item.icon className="h-4 w-4 text-[#186049]" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.14em] text-[#9a9298]">{item.title}</p>
                          <p className="font-medium text-[#3f393e]">{item.value}</p>
                        </div>
                      </a>
                    ) : (
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e3f0ea]">
                          <item.icon className="h-4 w-4 text-[#186049]" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.14em] text-[#9a9298]">{item.title}</p>
                          <p className="font-medium text-[#3f393e]">{item.value}</p>
                        </div>
                      </div>
                    )}
                </div>
              ))}

              {/* Business Hours */}
              <div className="mt-8 bg-[#f4f0ed] p-5">
                <h3 className="mb-4 font-serif text-2xl text-[#242024]">Business Hours</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-[#777077]">Monday - Friday</span>
                    <span className="font-medium text-[#3f393e]">9:00 AM - 9:00 PM</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#777077]">Saturday</span>
                    <span className="font-medium text-[#3f393e]">10:00 AM - 8:00 PM</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#777077]">Sunday</span>
                    <span className="font-medium text-[#3f393e]">11:00 AM - 6:00 PM</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 18 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-[#f4f0ed] p-6 md:p-8"
            >
                <div className="mb-8">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#186049]">We&apos;re listening</p>
                  <h2 className="font-serif text-4xl text-[#242024]">Send us a message</h2>
                </div>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777077]">Full Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          placeholder="Your name"
                          className="mt-2 h-12 rounded-none border-[#d8cfd3] bg-[#fffdfc] text-[#3f393e] focus-visible:ring-[#186049]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777077]">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          placeholder="your@email.com"
                          className="mt-2 h-12 rounded-none border-[#d8cfd3] bg-[#fffdfc] text-[#3f393e] focus-visible:ring-[#186049]"
                        />
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777077]">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+92 XXX XXXXXXX"
                          className="mt-2 h-12 rounded-none border-[#d8cfd3] bg-[#fffdfc] text-[#3f393e] focus-visible:ring-[#186049]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777077]">Subject *</Label>
                        <Input
                          id="subject"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          required
                          placeholder="How can we help?"
                          className="mt-2 h-12 rounded-none border-[#d8cfd3] bg-[#fffdfc] text-[#3f393e] focus-visible:ring-[#186049]"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777077]">Message *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                        placeholder="Tell us more about your inquiry..."
                        rows={5}
                        className="mt-2 rounded-none border-[#d8cfd3] bg-[#fffdfc] text-[#3f393e] focus-visible:ring-[#186049]"
                      />
                    </div>

                    <Button type="submit" size="lg" disabled={isSubmitting} className="h-12 rounded-none bg-[#242024] px-6 text-[10px] font-semibold uppercase tracking-[0.1em] text-white hover:bg-[#3f393e]">
                      <Send className="mr-2 h-4 w-4" />
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </form>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, PhoneCall, ShieldCheck, HeartPulse } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FAQItem {
  question: string;
  answer: string;
  category: 'General' | 'Consultations' | 'Medicines' | 'Emergency';
}

const faqs: FAQItem[] = [
  {
    category: 'Consultations',
    question: 'How do online doctor consultations work on Arogyam?',
    answer: 'Select a verified doctor by specialty or city, pick a convenient date and time slot, and submit your booking. You will instantly receive a private consultation Room ID. At appointment time, click "Join Call" in your profile or navigation to start an encrypted HD video consultation right from your browser—no downloads needed.',
  },
  {
    category: 'General',
    question: 'Are doctors on Arogyam verified and certified?',
    answer: 'Yes, 100%. Every medical practitioner on Arogyam submits their government medical council registration, MBBS/MD/BAMS degrees, and clinical experience. Our medical administrative board verifies these credentials before allowing them to accept patient appointments.',
  },
  {
    category: 'Medicines',
    question: 'Can I search and check availability of authentic Ayurvedic medicines?',
    answer: 'Absolutely. Arogyam features a catalog of authentic Ayurvedic formulations (such as Triphala, Ashwagandha, Chyawanprash, Brahmi, Tulsi, and Giloy). You can view indications, dosages, prices, and send delivery inquiries directly through the platform.',
  },
  {
    category: 'General',
    question: 'How does the 24/7 AI Medical Assistant work?',
    answer: 'Arogyam AI is equipped with clinical triage intelligence. You can ask symptom questions, explore Ayurvedic and lifestyle remedies, and get recommendations for which specialist to consult. In critical conditions, the assistant triggers an instant emergency alert with direct links to call 108/112 ambulance services.',
  },
  {
    category: 'Emergency',
    question: 'What should I do during a critical medical emergency?',
    answer: 'Telemedicine is not a substitute for emergency medicine. If you or someone nearby is experiencing acute chest pain, severe shortness of breath, sudden facial drooping or weakness, uncontrolled bleeding, or loss of consciousness, dial 108 or 112 immediately or proceed to the nearest emergency room.',
  },
  {
    category: 'General',
    question: 'Is Arogyam associated with pixir.in?',
    answer: 'Yes. Arogyam (arogyam.pixir.in) is the flagship digital health & telemedicine platform powered by Pixir (pixir.in), committed to democratizing high-quality medical care across Tier-1, Tier-2, and rural India.',
  },
];

const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Consultations', 'Medicines', 'Emergency', 'General'];

  const filteredFaqs = selectedCategory === 'All'
    ? faqs
    : faqs.filter(item => item.category === selectedCategory);

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden" id="faq">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-600 text-sm font-medium mb-3">
              <HelpCircle className="w-4 h-4" />
              Frequently Asked Questions
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Got Questions? We Have <span className="bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-transparent bg-clip-text">Answers</span>
            </h2>
            <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to know about online consultations, verified doctors, medicines, and healthcare on Arogyam (pixir.in).
            </p>
          </motion.div>

          {/* Category Pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-sm'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-red-300 hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Accordion */}
        <div className="space-y-4">
          {filteredFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-gray-50/70"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-gray-900 text-base md:text-lg flex items-center gap-3">
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-normal">
                      {faq.category}
                    </span>
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 flex-shrink-0 ml-4 transition-transform duration-200 ${
                      isOpen ? 'transform rotate-180 text-red-600' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-1 text-gray-600 border-t border-gray-100 text-sm md:text-base leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Quick CTA bar */}
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-red-500/10 via-pink-500/10 to-orange-500/10 border border-red-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center flex-shrink-0">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Need Immediate Health Consultation?</h4>
              <p className="text-sm text-gray-600">Connect with an on-duty specialist or talk to our 24/7 AI Medical Assistant.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/appointments"
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-red-600 to-orange-500 text-white font-medium text-sm shadow hover:opacity-95 transition-opacity whitespace-nowrap"
            >
              Book Doctor Now
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;

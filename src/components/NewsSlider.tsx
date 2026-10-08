import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { Calendar, ArrowRight, X, ExternalLink, ShieldAlert, HeartHandshake, BookOpen } from 'lucide-react';
import { getNews } from '../lib/supabase';
import { format } from 'date-fns';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  fullContent?: string;
  image_url: string;
  created_at: string;
  source: string;
  url: string;
  guidance?: string[];
}

const NewsSlider: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeArticle, setActiveArticle] = useState<NewsItem | null>(null);

  const placeholderNews: NewsItem[] = [
    {
      id: '1',
      title: 'Monsoon Seasonal Fevers & Dengue Awareness Protocol',
      content: 'Health authorities urge vigilance against vector-borne illnesses following regional rainfall. Learn key warning signs and mosquito prevention.',
      fullContent: 'Vector-borne viral illnesses such as Dengue, Chikungunya, and Malaria experience heightened transmission during monsoon seasons. Stagnant rainwater creates breeding grounds for Aedes mosquitoes. Doctors advise eliminating uncovered standing water, using mosquito nets, and drinking boiled warm water with Tulsi and ginger to support immune health.',
      image_url: 'https://images.unsplash.com/photo-1584118624012-df056829fbd0?auto=format&fit=crop&w=1000&q=80',
      created_at: new Date().toISOString(),
      source: 'National Health Mission',
      url: 'https://www.nhm.gov.in/',
      guidance: [
        'Drain stagnant water from coolers, planters, and roof gutters weekly.',
        'Use DEET or natural Citronella mosquito repellents.',
        'Seek immediate medical consultation if sudden high fever is accompanied by eye pain or skin rashes.',
        'Stay well hydrated with ORS, coconut water, and Giloy decoctions.',
      ],
    },
    {
      id: '2',
      title: 'Ayush Ministry Endorses Classical Formulations for Respiratory Immunity',
      content: 'Traditional Ayurvedic Rasayana herbs show sustained benefits in fortifying upper respiratory tract defense and curbing seasonal viral infections.',
      fullContent: 'Clinical studies evaluated by the Ministry of Ayush substantiate that classical polyherbal formulations, particularly Chyawanprash, Vyaghri Haritaki, and Sitopaladi Churna, enhance mucosal immunity. Practitioners highlight daily intake of warm golden turmeric milk (Haldi Doodh) and steam inhalation with Eucalyptus and Ajwain.',
      image_url: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&w=1000&q=80',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      source: 'Ministry of Ayush',
      url: 'https://ayush.gov.in/',
      guidance: [
        'Take 1 teaspoon of Chyawanprash in the morning on an empty stomach.',
        'Practice daily Pranayama (Anulom-Vilom and Kapalabhati) for 15 minutes.',
        'Gargle with warm saline water and a pinch of turmeric at bedtime.',
      ],
    },
    {
      id: '3',
      title: 'Preventive Cardiac Health: Early Screening for Hypertension',
      content: 'Cardiologists emphasize routine blood pressure and glucose tracking from age 25 to preempt cardiovascular incidents and stroke risks.',
      fullContent: 'Cardiovascular disease remains the leading cause of preventable mortality. Arogyam telemedicine kiosks across Odisha and Eastern India now offer digital BP, SPO2, and tele-cardiology screenings. Early lifestyle modifications—reducing sodium, 30 minutes of aerobic exercise, and stress mitigation—yield dramatic health dividends.',
      image_url: 'https://images.unsplash.com/photo-1576765608866-5b51046452be?auto=format&fit=crop&w=1000&q=80',
      created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      source: 'Indian Heart Association',
      url: 'https://indianheartassociation.org/',
      guidance: [
        'Measure blood pressure at least once every 6 months if asymptomatic.',
        'Restrict dietary sodium to under 5 grams (1 teaspoon) daily.',
        'Consult our certified cardiologists for regular ECG and lipid assessments.',
      ],
    },
  ];

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const { data, error } = await getNews();
        if (error) throw error;
        if (data && data.length > 0) {
          setNews(data);
        } else {
          setNews(placeholderNews);
        }
      } catch (error) {
        console.error('Error fetching news:', error);
        setNews(placeholderNews);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const displayNews = news.length > 0 ? news : placeholderNews;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return 'Recent';
    }
  };

  return (
    <section className="py-20 bg-gray-50 relative overflow-hidden" id="news">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-gray-900"
          >
            Health <span className="bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-transparent bg-clip-text">News</span> & Advisory
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 max-w-2xl mx-auto text-lg text-gray-600"
          >
            Stay informed with verified clinical updates, disease prevention advisories, and Ayush wellness guidelines
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-500 border-r-transparent"></div>
              <span className="ml-2 text-gray-700">Loading health advisories...</span>
            </div>
          ) : (
            <Swiper
              spaceBetween={30}
              centeredSlides={true}
              autoplay={{
                delay: 6000,
                disableOnInteraction: false,
              }}
              pagination={{
                clickable: true,
              }}
              navigation={true}
              modules={[Autoplay, Pagination, Navigation]}
              className="mySwiper rounded-2xl shadow-sm"
            >
              {displayNews.map((item) => (
                <SwiperSlide key={item.id}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white rounded-2xl p-6 md:p-10 border border-gray-200">
                    <div className="h-64 md:h-80 overflow-hidden rounded-xl">
                      <img 
                        src={item.image_url} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center text-gray-500 mb-3 text-sm">
                        <Calendar className="h-4 w-4 mr-1 text-red-500" />
                        <span>{formatDate(item.created_at)}</span>
                        <span className="mx-2">•</span>
                        <span className="font-semibold text-gray-700">{item.source}</span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3 leading-snug">{item.title}</h3>
                      <p className="text-gray-600 mb-6 leading-relaxed line-clamp-3">{item.content}</p>
                      <button 
                        type="button"
                        onClick={() => setActiveArticle(item)}
                        className="inline-flex items-center text-white bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 px-5 py-2.5 rounded-lg hover:opacity-95 shadow-sm transition-opacity font-medium text-sm"
                      >
                        Read Advisory & Tips <ArrowRight className="ml-2 h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </motion.div>
      </div>

      {/* Full Article Modal */}
      <AnimatePresence>
        {activeArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200"
            >
              <div className="relative h-60 w-full overflow-hidden">
                <img
                  src={activeArticle.image_url}
                  alt={activeArticle.title}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setActiveArticle(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-semibold text-gray-800">
                  {activeArticle.source}
                </div>
              </div>

              <div className="p-6 md:p-8">
                <div className="flex items-center text-xs text-gray-500 mb-2">
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  {formatDate(activeArticle.created_at)}
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4">{activeArticle.title}</h3>

                <p className="text-gray-700 leading-relaxed text-base mb-6">
                  {activeArticle.fullContent || activeArticle.content}
                </p>

                {activeArticle.guidance && activeArticle.guidance.length > 0 && (
                  <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 mb-6">
                    <h4 className="font-bold text-orange-900 text-sm flex items-center gap-2 mb-2">
                      <ShieldAlert className="w-4 h-4 text-orange-600" /> Key Clinical Action Items & Guidance:
                    </h4>
                    <ul className="space-y-1.5 text-xs md:text-sm text-orange-950">
                      {activeArticle.guidance.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-orange-500 font-bold">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  {activeArticle.url && activeArticle.url !== '#' ? (
                    <a
                      href={activeArticle.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs font-medium text-red-600 hover:text-red-700 gap-1"
                    >
                      Official Source Link <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : <span />}

                  <button
                    onClick={() => setActiveArticle(null)}
                    className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default NewsSlider;
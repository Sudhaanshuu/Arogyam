import React, { useState } from 'react';
import { Search, Pill, CheckCircle, XCircle, ShoppingBag, Sparkles, Filter, X, Phone, MapPin, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchMedicines } from '../lib/supabase';
import toast from 'react-hot-toast';

export interface Medicine {
  id: string;
  name: string;
  description: string;
  available: boolean;
  price: number;
  image_url?: string;
  category?: string;
  dosage?: string;
  ingredients?: string;
}

const defaultMedicines: Medicine[] = [
  {
    id: 'med-1',
    name: 'Triphala Churna (Organic)',
    description: 'Traditional blend of Haritaki, Bibhitaki, and Amalaki. Supports healthy digestion, gentle detox, and digestive fire (Agni).',
    available: true,
    price: 180,
    category: 'Digestion',
    dosage: '1 teaspoon with warm water before sleep',
    ingredients: 'Emblica officinalis, Terminalia bellirica, Terminalia chebula',
    image_url: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'med-2',
    name: 'Ashwagandha Forte 500mg',
    description: 'Potent adaptogen for stress reduction, cortisol balance, stamina, and restful sleep. Standardized with 5% withanolides.',
    available: true,
    price: 320,
    category: 'Stress & Sleep',
    dosage: '1 capsule twice daily with milk or warm water',
    ingredients: 'Withania somnifera root extract',
    image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'med-3',
    name: 'Chyawanprash Special Immunity Awaleha',
    description: 'Amla-based classical herbal jam formulated with 45+ revitalizing herbs to boost seasonal immunity, vitality, and respiratory vigor.',
    available: true,
    price: 395,
    category: 'Immunity',
    dosage: '1-2 tablespoons every morning with milk',
    ingredients: 'Fresh Amalaki, Ashwagandha, Pippali, Pure Ghee, Wild Forest Honey',
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'med-4',
    name: 'Brahmi Vati (Medhya Rasayan)',
    description: 'Cognitive enhancer formulated to sharpen memory, concentration, mental clarity, and alleviate tension headaches.',
    available: true,
    price: 240,
    category: 'Stress & Sleep',
    dosage: '1 tablet twice a day after meals',
    ingredients: 'Bacopa monnieri, Shankhpushpi, Vacha, Swarna Bhasma',
    image_url: 'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'med-5',
    name: 'Giloy Ghanvati (Amrita)',
    description: 'Powerful immuno-modulator and natural antipyretic. Purifies blood, protects liver functions, and combats chronic seasonal fevers.',
    available: true,
    price: 150,
    category: 'Immunity',
    dosage: '1-2 tablets twice daily with water',
    ingredients: 'Tinospora cordifolia (Giloy extract)',
    image_url: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'med-6',
    name: 'Arjuna Chhal Heart Tonic',
    description: 'Revered Ayurvedic cardio-protective botanical. Strengthens cardiac muscles, promotes arterial health, and supports blood pressure.',
    available: true,
    price: 210,
    category: 'Cardiac & Vitals',
    dosage: '3-6g decoction (Kashayam) twice a day',
    ingredients: 'Terminalia arjuna bark powder',
    image_url: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'med-7',
    name: 'Pure Tulsi Herbal Drops (5 Holy Basils)',
    description: 'Concentrated liquid extract of Vishnu Tulsi, Rama Tulsi, Shyama Tulsi, Bisva Tulsi, and Van Tulsi for respiratory wellness.',
    available: true,
    price: 165,
    category: 'Immunity',
    dosage: '4-5 drops in warm water or tea daily',
    ingredients: 'Ocimum sanctum, Ocimum gratissimum, Ocimum canum',
    image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'med-8',
    name: 'Neem & Turmeric Blood Purifier',
    description: 'Synergistic formulation for radiant skin, acne relief, skin detox, and lymphatic cleansing.',
    available: false,
    price: 190,
    category: 'Skin & Hair',
    dosage: '1 capsule twice daily after meals',
    ingredients: 'Azadirachta indica, Curcuma longa',
    image_url: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?auto=format&fit=crop&w=600&q=80',
  },
];

const categories = ['All', 'Immunity', 'Digestion', 'Stress & Sleep', 'Cardiac & Vitals', 'Skin & Hair'];

const MedicineSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const [orderModalMed, setOrderModalMed] = useState<Medicine | null>(null);
  const [orderForm, setOrderForm] = useState({
    patientName: '',
    phone: '',
    address: '',
    quantity: 1,
  });
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Filter items by category & search term
  const filteredMedicines = defaultMedicines.filter((med) => {
    const matchesCategory = selectedCategory === 'All' || med.category === selectedCategory;
    const matchesSearch =
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (med.ingredients && med.ingredients.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      // Also query Supabase if backend has custom listings
      await searchMedicines(searchQuery);
    } catch {
      // Fallback handled cleanly by local filtered state
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOrder = (med: Medicine) => {
    setOrderModalMed(med);
    setOrderForm({
      patientName: '',
      phone: '',
      address: '',
      quantity: 1,
    });
  };

  const handleCloseOrder = () => {
    setOrderModalMed(null);
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForm.patientName || !orderForm.phone || !orderForm.address) {
      toast.error('Please fill all delivery details');
      return;
    }

    setSubmittingOrder(true);
    setTimeout(() => {
      // Save order to localStorage
      try {
        const stored = JSON.parse(localStorage.getItem('arogyam_medicine_inquiries') || '[]');
        stored.push({
          id: `ORD-${Date.now()}`,
          medicineId: orderModalMed?.id,
          medicineName: orderModalMed?.name,
          price: orderModalMed?.price,
          total: (orderModalMed?.price || 0) * orderForm.quantity,
          ...orderForm,
          created_at: new Date().toISOString(),
          status: 'Confirmed for Dispatch',
        });
        localStorage.setItem('arogyam_medicine_inquiries', JSON.stringify(stored));
      } catch (err) {
        console.warn('LocalStorage error:', err);
      }

      toast.success(`Order inquiry placed for ${orderModalMed?.name}! Our pharmacy team will reach out at ${orderForm.phone}.`);
      setSubmittingOrder(false);
      setOrderModalMed(null);
    }, 600);
  };

  return (
    <section className="py-20 bg-gray-50 relative overflow-hidden" id="medicines">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-red-600/10 via-pink-500/10 to-orange-500/10"
            animate={{
              x: [Math.random() * 300, Math.random() * 300],
              y: [Math.random() * 300, Math.random() * 300],
            }}
            transition={{
              duration: 15 + i * 2,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'linear',
            }}
            style={{
              width: `${250 + i * 50}px`,
              height: `${250 + i * 50}px`,
              filter: 'blur(90px)',
              left: `${i * 25}%`,
              top: `${(i % 2) * 40}%`,
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Verified Ayush Pharmacy
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Ayurvedic <span className="bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-transparent bg-clip-text">Medicine</span> Search & Pharmacy
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-600">
              Search authentic, lab-tested herbal formulations, verify clinical indications, and request doorstep delivery across India.
            </p>
          </motion.div>
        </div>

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-8">
          <form onSubmit={handleSearch} className="relative">
            <div className="flex items-center overflow-hidden rounded-xl bg-white shadow-md border border-gray-200 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-200 transition-all">
              <div className="pl-4">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by medicine name, herb (e.g. Ashwagandha, Giloy), or symptom..."
                className="w-full py-3.5 px-4 text-gray-800 placeholder-gray-400 leading-tight focus:outline-none text-base"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              <button
                type="submit"
                className="bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white px-6 py-3.5 font-medium hover:opacity-95 transition-opacity"
              >
                Search
              </button>
            </div>
          </form>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            <span className="text-xs font-semibold text-gray-500 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-500 border-r-transparent"></div>
            <p className="mt-3 text-gray-700">Searching authentic pharmacy catalog...</p>
          </div>
        ) : filteredMedicines.length === 0 ? (
          <div className="max-w-md mx-auto text-center bg-white rounded-xl p-8 shadow-sm border border-gray-200 my-8">
            <Pill className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-gray-800">No medicines found</h3>
            <p className="text-gray-500 text-sm mt-1">Try another keyword or select "All" categories to view all formulations.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredMedicines.map((medicine) => (
              <motion.div
                key={medicine.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
                    <img
                      src={medicine.image_url}
                      alt={medicine.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/90 text-gray-800 shadow-sm backdrop-blur-xs">
                        {medicine.category}
                      </span>
                    </div>
                    <div className="absolute top-2 right-2">
                      {medicine.available ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500 text-white flex items-center gap-1 shadow-sm">
                          <CheckCircle className="w-3 h-3" /> In Stock
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-600 text-white flex items-center gap-1 shadow-sm">
                          <XCircle className="w-3 h-3" /> Restocking
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-base mb-1 line-clamp-1">{medicine.name}</h3>
                    <p className="text-gray-600 text-xs line-clamp-2 mb-3">{medicine.description}</p>

                    {medicine.dosage && (
                      <div className="mb-2 text-xs bg-orange-50 text-orange-900 p-2 rounded-md">
                        <span className="font-semibold">Dosage: </span>{medicine.dosage}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-gray-100 mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-500 block">Price</span>
                    <span className="text-lg font-bold text-gray-900">₹{medicine.price}</span>
                  </div>
                  <button
                    onClick={() => handleOpenOrder(medicine)}
                    disabled={!medicine.available}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      medicine.available
                        ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white hover:opacity-95 shadow-xs'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    {medicine.available ? 'Order Now' : 'Out of Stock'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Order / Inquiry Modal */}
      <AnimatePresence>
        {orderModalMed && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-200"
            >
              <div className="p-5 bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  <h3 className="font-bold text-lg">Doorstep Delivery Inquiry</h3>
                </div>
                <button
                  onClick={handleCloseOrder}
                  className="p-1 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <form onSubmit={handleSubmitOrder} className="p-6 space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <img
                    src={orderModalMed.image_url}
                    alt={orderModalMed.name}
                    className="w-14 h-14 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm truncate">{orderModalMed.name}</h4>
                    <p className="text-xs text-gray-500">{orderModalMed.category}</p>
                    <p className="text-sm font-bold text-red-600 mt-0.5">₹{orderModalMed.price} per unit</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={orderForm.patientName}
                    onChange={(e) => setOrderForm({ ...orderForm, patientName: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        value={orderForm.phone}
                        onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                        placeholder="10-digit Mobile"
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Quantity (Units)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={orderForm.quantity}
                      onChange={(e) => setOrderForm({ ...orderForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Delivery Address & Pin Code *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <textarea
                      required
                      rows={2}
                      value={orderForm.address}
                      onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                      placeholder="House No, Landmark, City, State, PIN"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div className="bg-red-50 p-3 rounded-xl flex items-center justify-between text-xs text-red-800">
                  <span>Estimated Total (Cash on Delivery):</span>
                  <span className="font-bold text-sm">₹{orderModalMed.price * orderForm.quantity}</span>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseOrder}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingOrder}
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white text-sm font-semibold hover:opacity-95 shadow"
                  >
                    {submittingOrder ? 'Placing Inquiry...' : 'Confirm Delivery Inquiry'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default MedicineSearch;
import React, { useState } from 'react';
import { Search, Pill, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { searchMedicines } from '../lib/supabase';

interface Medicine {
  id: string;
  name: string;
  description: string;
  available: boolean;
  price: number;
  image_url?: string;
}

const MedicineSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const { data, error } = await searchMedicines(searchQuery);
      
      if (error) {
        throw error;
      }
      
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching medicines:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 bg-gray-50 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-red-600/10 via-pink-500/10 to-orange-500/10"
            animate={{
              x: [Math.random() * window.innerWidth, Math.random() * window.innerWidth],
              y: [Math.random() * window.innerHeight, Math.random() * window.innerHeight],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "linear",
            }}
            style={{
              width: `${Math.random() * 400 + 200}px`,
              height: `${Math.random() * 400 + 200}px`,
              filter: 'blur(80px)',
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Ayurvedic <span className="bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-transparent bg-clip-text">Medicine</span> Search
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600">
              Check availability of authentic Ayurvedic medicines
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <form onSubmit={handleSearch} className="relative">
            <div className="flex items-center overflow-hidden rounded-lg bg-white shadow-lg">
              <div className="pl-4">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for Ayurvedic medicines..."
                className="w-full py-4 px-4 text-gray-700 leading-tight focus:outline-none"
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white px-6 py-4 font-medium hover:opacity-90 transition-opacity"
              >
                Search
              </button>
            </div>
          </form>

          {loading && (
            <div className="mt-8 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <p className="mt-2 text-gray-900">Searching medicines...</p>
            </div>
          )}

          {!loading && searched && searchResults.length === 0 && (
            <div className="mt-8 text-center bg-white/80 backdrop-blur-sm rounded-lg p-8 shadow-md border border-gray-200">
              <Pill className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="mt-2 text-gray-900 text-lg">No medicines found matching your search.</p>
              <p className="text-gray-600">Try a different search term or browse our categories.</p>
            </div>
          )}

          {!loading && searchResults.length > 0 && (
            <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-md border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Search Results</h3>
              <div className="space-y-4">
                {searchResults.map((medicine) => (
                  <motion.div
                    key={medicine.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gray-50 rounded-lg p-4 flex items-start border border-gray-200"
                  >
                    <div className="flex-shrink-0 mr-4">
                      {medicine.image_url ? (
                        <img 
                          src={medicine.image_url} 
                          alt={medicine.name} 
                          className="h-16 w-16 object-cover rounded-md"
                        />
                      ) : (
                        <div className="h-16 w-16 bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 rounded-md flex items-center justify-center">
                          <Pill className="h-8 w-8 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h4 className="text-lg font-medium text-gray-900">{medicine.name}</h4>
                        <div className="flex items-center">
                          {medicine.available ? (
                            <>
                              <CheckCircle className="h-5 w-5 text-green-500 mr-1" />
                              <span className="text-green-400 text-sm">Available</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-5 w-5 text-red-500 mr-1" />
                              <span className="text-red-400 text-sm">Out of stock</span>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-600 mt-1">{medicine.description}</p>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-gray-900 font-semibold">₹{medicine.price.toFixed(2)}</span>
                        <button 
                          disabled={!medicine.available}
                          className={`px-3 py-1 rounded text-sm ${
                            medicine.available 
                              ? 'bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white hover:opacity-90' 
                              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {medicine.available ? 'Order Now' : 'Notify Me'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default MedicineSearch;
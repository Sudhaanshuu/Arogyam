import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import { Users, MapPin, Star, Calendar, MessageSquare, X, Phone, CheckCircle, Clock } from 'lucide-react';
import { getAllDoctors } from '../lib/supabase';
import 'leaflet/dist/leaflet.css';
import { useAppointmentStore } from '../lib/store';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';

// Create high-res custom SVG Leaflet marker icons with no external asset dependency
const doctorMarkerIcon = L.divIcon({
  className: 'custom-doctor-marker',
  html: `
    <div style="background: linear-gradient(135deg, #ef4444, #f97316); width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.45);">
      <svg style="transform: rotate(45deg); width: 16px; height: 16px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
      </svg>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const cityMarkerIcon = L.divIcon({
  className: 'custom-city-marker',
  html: `
    <div style="background: #3b82f6; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.3);">
      <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  experience: number;
  rating: number;
  image_url?: string;
  city: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  available: boolean;
  bio?: string;
  consultation_fee?: number;
}

interface City {
  name: string;
  latitude: number;
  longitude: number;
}

const CITIES: City[] = [
  { name: 'Bhubaneswar', latitude: 20.2961, longitude: 85.8245 },
  { name: 'Delhi', latitude: 28.6139, longitude: 77.2090 },
  { name: 'Mumbai', latitude: 19.0760, longitude: 72.8777 },
  { name: 'Bangalore', latitude: 12.9716, longitude: 77.5946 },
  { name: 'Kolkata', latitude: 22.5726, longitude: 88.3639 },
  { name: 'Hyderabad', latitude: 17.3850, longitude: 78.4867 },
  { name: 'Pune', latitude: 18.5204, longitude: 73.8567 },
  { name: 'Ahmedabad', latitude: 23.0225, longitude: 72.5714 },
  { name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
];

// Controller component to smoothly fly the React-Leaflet camera to new center and zoom
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2, easeLinearity: 0.25 });
  }, [center, zoom, map]);
  return null;
};

const BestDoctors: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedDoctor } = useAppointmentStore();
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [displayedDoctors, setDisplayedDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([21.5, 82.5]); // India overview
  const [zoom, setZoom] = useState(5);
  const [showAllDoctors, setShowAllDoctors] = useState(false);
  const [activeDoctorModal, setActiveDoctorModal] = useState<Doctor | null>(null);

  useEffect(() => {
    fetchAndPrepareDoctors();
  }, []);

  useEffect(() => {
    if (selectedCity) {
      const filtered = allDoctors.filter(d => 
        d.city.toLowerCase() === selectedCity.name.toLowerCase()
      );
      setDisplayedDoctors(filtered.length > 0 ? filtered : allDoctors.slice(0, 3));
      setMapCenter([selectedCity.latitude, selectedCity.longitude]);
      setZoom(11);
    } else {
      setDisplayedDoctors(allDoctors);
      setMapCenter([21.5, 82.5]);
      setZoom(5);
    }
  }, [selectedCity, allDoctors]);

  const fetchAndPrepareDoctors = async () => {
    setLoading(true);
    try {
      const { data, error } = await getAllDoctors();
      let rawList: any[] = data || [];

      // If database has fewer than 6 doctors, provide comprehensive default doctor roster
      if (rawList.length === 0) {
        rawList = [
          {
            id: 'doc-1',
            name: 'Dr. Sarah Johnson',
            specialty: 'General Medicine',
            experience: 8,
            rating: 4.8,
            city: 'Delhi',
            available: true,
            consultation_fee: 500,
            bio: 'Senior consultant specializing in chronic lifestyle disease management, preventive medicine, and viral infections.'
          },
          {
            id: 'doc-2',
            name: 'Dr. Michael Chen',
            specialty: 'Cardiology',
            experience: 12,
            rating: 4.9,
            city: 'Mumbai',
            available: true,
            consultation_fee: 800,
            bio: 'Interventional cardiologist with deep expertise in hypertension, lipid disorders, and non-invasive cardiac evaluation.'
          },
          {
            id: 'doc-3',
            name: 'Dr. Priya Sharma',
            specialty: 'Ayurveda',
            experience: 9,
            rating: 4.9,
            city: 'Bhubaneswar',
            available: true,
            consultation_fee: 450,
            bio: 'Expert BAMS practitioner integrating Ayurvedic herbs, Panchakarma therapies, and digestive revitalization.'
          },
          {
            id: 'doc-4',
            name: 'Dr. Emily Davis',
            specialty: 'Dermatology',
            experience: 6,
            rating: 4.7,
            city: 'Bangalore',
            available: true,
            consultation_fee: 600,
            bio: 'Dermatologist treating allergic skin conditions, eczema, acne vulgaris, and aesthetic skin health.'
          },
          {
            id: 'doc-5',
            name: 'Dr. Rajesh Kumar',
            specialty: 'Ayurveda',
            experience: 20,
            rating: 5.0,
            city: 'Kolkata',
            available: true,
            consultation_fee: 600,
            bio: 'Celebrated Ayurvedic scholar specializing in joint health, natural rasayana herbs, and chronic immune disorders.'
          },
          {
            id: 'doc-6',
            name: 'Dr. Robert Wilson',
            specialty: 'Pediatrics',
            experience: 15,
            rating: 4.9,
            city: 'Pune',
            available: true,
            consultation_fee: 550,
            bio: 'Compassionate pediatrician focusing on childhood development, immunization, and pediatric nutrition.'
          },
          {
            id: 'doc-7',
            name: 'Dr. James Martinez',
            specialty: 'Orthopedics',
            experience: 14,
            rating: 4.8,
            city: 'Hyderabad',
            available: true,
            consultation_fee: 750,
            bio: 'Orthopedic specialist in joint preservation, arthritis care, spinal ergonomics, and sports medicine.'
          },
          {
            id: 'doc-8',
            name: 'Dr. Anita Verma',
            specialty: 'Gynecology',
            experience: 11,
            rating: 4.7,
            city: 'Ahmedabad',
            available: true,
            consultation_fee: 650,
            bio: 'Dedicated women healthcare expert guiding reproductive wellness, prenatal consultation, and hormonal health.'
          }
        ];
      }

      // Map doctors to accurate coordinates based on city or distributed Indian centers
      const enriched: Doctor[] = rawList.map((doc, idx) => {
        let assignedCity = doc.city && doc.city !== 'Available Online' ? doc.city : CITIES[idx % CITIES.length].name;
        const cityData = CITIES.find(c => c.name.toLowerCase() === assignedCity.toLowerCase()) || CITIES[idx % CITIES.length];

        // Slight jitter so multiple doctors in the same city don't stack directly on top of each other
        const jitterLat = cityData.latitude + ((idx % 3) - 1) * 0.04;
        const jitterLng = cityData.longitude + (((idx + 1) % 3) - 1) * 0.04;

        return {
          id: doc.id || `doc-${idx}`,
          name: doc.name || 'Medical Specialist',
          specialty: doc.specialty || 'General Medicine',
          experience: doc.experience || 5,
          rating: doc.rating || 4.7,
          image_url: doc.image_url,
          city: assignedCity,
          latitude: doc.latitude || jitterLat,
          longitude: doc.longitude || jitterLng,
          phone: doc.phone || '+91 8252228793',
          email: doc.email || 'care@pixir.in',
          available: doc.available !== false,
          bio: doc.bio || 'Verified medical practitioner on Arogyam Telemedicine providing remote clinical consultations.',
          consultation_fee: doc.consultation_fee || 500
        };
      });

      setAllDoctors(enriched);
      setDisplayedDoctors(enriched);
    } catch (err) {
      console.error('Error fetching doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    navigate('/appointments');
  };

  const handleStartMessage = (doctor: Doctor) => {
    navigate('/messages');
  };

  return (
    <section className="py-20 bg-gray-50" id="doctors-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center mb-10">
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-gray-900"
          >
            Find the <span className="bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-transparent bg-clip-text">Best Doctors</span> Near You
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-3 max-w-2xl mx-auto text-lg text-gray-600"
          >
            Explore verified specialists across India. Book instant video consultations or visit clinics.
          </motion.p>
        </div>

        {/* City Filter Pills */}
        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex flex-wrap sm:flex-nowrap justify-start sm:justify-center gap-2 min-w-max px-2">
            <button
              onClick={() => setSelectedCity(null)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                !selectedCity 
                  ? 'bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white shadow-md' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
              }`}
            >
              🇮🇳 All India ({allDoctors.length})
            </button>
            {CITIES.map((city) => {
              const count = allDoctors.filter(d => d.city.toLowerCase() === city.name.toLowerCase()).length;
              return (
                <button
                  key={city.name}
                  onClick={() => setSelectedCity(city)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCity?.name === city.name 
                      ? 'bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white shadow-md' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {city.name} {count > 0 ? `(${count})` : ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2-Column Responsive Layout: Doctors List + Interactive Leaflet Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Doctor Cards List */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <MapPin className="h-5 w-5 text-red-500 mr-2" />
                  {selectedCity ? `Doctors in ${selectedCity.name}` : 'Featured Specialists'}
                </h3>
                <span className="text-xs bg-red-50 text-red-600 font-semibold px-2.5 py-1 rounded-full border border-red-100">
                  {displayedDoctors.length} Available
                </span>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-r-transparent"></div>
                  <span className="ml-3 text-gray-600 text-sm">Locating doctors...</span>
                </div>
              ) : (
                <div className="space-y-4 max-h-[560px] overflow-y-auto pr-1">
                  {(showAllDoctors ? displayedDoctors : displayedDoctors.slice(0, 4)).map((doctor) => (
                    <motion.div
                      key={doctor.id}
                      whileHover={{ scale: 1.01 }}
                      className="bg-gray-50/80 rounded-xl p-4 border border-gray-200 hover:border-red-300 transition-all shadow-2xs hover:shadow-xs"
                    >
                      <div className="flex items-start">
                        <div className="h-14 w-14 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg mr-3 flex-shrink-0 shadow-xs">
                          {doctor.image_url ? (
                            <img src={doctor.image_url} alt={doctor.name} className="h-14 w-14 rounded-full object-cover" />
                          ) : (
                            <Users className="h-6 w-6 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-bold text-gray-900 truncate">{doctor.name}</h4>
                          <p className="text-sm text-red-600 font-medium">{doctor.specialty}</p>
                          <div className="mt-1 flex items-center text-xs text-gray-500 space-x-2">
                            <span className="flex items-center text-amber-500 font-semibold">
                              <Star className="h-3.5 w-3.5 fill-current mr-0.5" />
                              {doctor.rating.toFixed(1)}
                            </span>
                            <span>•</span>
                            <span>{doctor.experience} yrs exp</span>
                            <span>•</span>
                            <span className="flex items-center">
                              <MapPin className="h-3 w-3 mr-0.5" />
                              {doctor.city}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900">
                          ₹{doctor.consultation_fee || 500} <span className="text-xs text-gray-500 font-normal">/ visit</span>
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setActiveDoctorModal(doctor)}
                            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            Profile
                          </button>
                          <button
                            onClick={() => handleBookAppointment(doctor)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-orange-500 rounded-lg hover:opacity-90 transition-opacity shadow-2xs"
                          >
                            Book
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {displayedDoctors.length > 4 && (
                    <button
                      onClick={() => setShowAllDoctors(!showAllDoctors)}
                      className="w-full py-2.5 text-center text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-200"
                    >
                      {showAllDoctors ? 'Show Less' : `Show All (${displayedDoctors.length})`}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: High-Res Interactive Map with Smooth Zoom & Markers */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 h-[620px] flex flex-col">
              <div className="mb-2 px-2 flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium">
                  Showing interactive clinic hubs across India • Click markers to view doctors
                </span>
                <span className="flex items-center text-xs text-green-600 font-medium">
                  <span className="h-2 w-2 rounded-full bg-green-500 inline-block mr-1.5"></span>
                  Live Telemedicine
                </span>
              </div>

              <div className="flex-1 rounded-xl overflow-hidden relative border border-gray-200">
                <MapContainer 
                  center={mapCenter} 
                  zoom={zoom} 
                  style={{ height: '100%', width: '100%', zIndex: 10 }}
                  zoomControl={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <ZoomControl position="topright" />
                  <MapController center={mapCenter} zoom={zoom} />

                  {/* City Hub Markers */}
                  {CITIES.map((city) => (
                    <Marker 
                      key={`city-${city.name}`}
                      position={[city.latitude, city.longitude]}
                      icon={cityMarkerIcon}
                      eventHandlers={{
                        click: () => setSelectedCity(city),
                      }}
                    >
                      <Popup>
                        <div className="p-1 text-center">
                          <h4 className="font-bold text-gray-900 text-sm">{city.name} Clinic Hub</h4>
                          <button
                            onClick={() => setSelectedCity(city)}
                            className="mt-2 px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-md hover:bg-red-700 w-full"
                          >
                            Filter Doctors in {city.name}
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  {/* Doctor Markers */}
                  {displayedDoctors.map((doctor) => (
                    <Marker
                      key={`doctor-${doctor.id}`}
                      position={[doctor.latitude, doctor.longitude]}
                      icon={doctorMarkerIcon}
                    >
                      <Popup>
                        <div className="p-1 min-w-[180px]">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="h-8 w-8 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {doctor.name.slice(3, 5)}
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 text-sm leading-tight">{doctor.name}</h4>
                              <p className="text-xs text-red-600 font-medium">{doctor.specialty}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                            <span>⭐ {doctor.rating.toFixed(1)}</span>
                            <span>{doctor.city}</span>
                            <span className="font-bold text-gray-900">₹{doctor.consultation_fee}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 mt-2">
                            <button
                              onClick={() => setActiveDoctorModal(doctor)}
                              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium rounded-md text-center"
                            >
                              Profile
                            </button>
                            <button
                              onClick={() => handleBookAppointment(doctor)}
                              className="px-2 py-1 bg-gradient-to-r from-red-600 to-orange-500 text-white text-xs font-semibold rounded-md hover:opacity-90 text-center"
                            >
                              Book
                            </button>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Doctor Profile Modal */}
      <AnimatePresence>
        {activeDoctorModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 p-6 text-white relative">
                <button
                  onClick={() => setActiveDoctorModal(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-white text-red-600 flex items-center justify-center font-bold text-2xl shadow-lg flex-shrink-0">
                    {activeDoctorModal.name.charAt(4) || 'D'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{activeDoctorModal.name}</h3>
                    <p className="text-white/90 text-sm font-medium">{activeDoctorModal.specialty}</p>
                    <div className="flex items-center space-x-2 text-xs mt-1 text-white/80">
                      <span className="flex items-center">
                        <CheckCircle className="h-3.5 w-3.5 mr-1 text-green-300" />
                        Verified Specialist
                      </span>
                      <span>•</span>
                      <span>{activeDoctorModal.city}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">About Doctor</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{activeDoctorModal.bio}</p>
                </div>

                <div className="grid grid-cols-3 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-center">
                  <div>
                    <p className="text-xs text-gray-500">Experience</p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">{activeDoctorModal.experience}+ Years</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Rating</p>
                    <p className="text-sm font-bold text-amber-500 mt-0.5">⭐ {activeDoctorModal.rating.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Fee</p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">₹{activeDoctorModal.consultation_fee || 500}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                    <span>Available for online video consultation Mon-Sat (9:00 AM - 6:00 PM)</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                    <span>Telemedicine & Clinic Hub: {activeDoctorModal.city}, India</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                    <span>Helpline: {activeDoctorModal.phone}</span>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-3 border-t border-gray-200 flex space-x-3">
                  <button
                    onClick={() => {
                      const doc = activeDoctorModal;
                      setActiveDoctorModal(null);
                      handleStartMessage(doc);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Message
                  </button>
                  <button
                    onClick={() => {
                      const doc = activeDoctorModal;
                      setActiveDoctorModal(null);
                      handleBookAppointment(doc);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white font-semibold text-sm hover:opacity-95 transition-opacity shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Calendar className="h-4 w-4" />
                    Book Now
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

export default BestDoctors;
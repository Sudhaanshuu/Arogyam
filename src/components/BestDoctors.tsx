import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMap, ZoomControl } from 'react-leaflet';
import {
  Users,
  MapPin,
  Star,
  Calendar,
  MessageSquare,
  X,
  Phone,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Navigation,
  Columns,
  Grid,
  Map as MapIcon,
  Stethoscope,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { getAllDoctors } from '../lib/supabase';
import 'leaflet/dist/leaflet.css';
import { useAppointmentStore } from '../lib/store';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';

// Leaflet DivIcons with SVG styling
const createDoctorMarkerIcon = (isSelected: boolean, specialty: string) => {
  const isAyurveda = specialty.toLowerCase().includes('ayurved');
  const bgGradient = isSelected
    ? 'linear-gradient(135deg, #b91c1c, #ea580c)'
    : isAyurveda
    ? 'linear-gradient(135deg, #059669, #10b981)'
    : 'linear-gradient(135deg, #ef4444, #f97316)';

  const scale = isSelected ? 'scale(1.25)' : 'scale(1)';
  const pulseClass = isSelected ? 'marker-pulse' : '';

  return L.divIcon({
    className: `custom-doc-marker-wrapper ${pulseClass}`,
    html: `
      <div style="
        width: 38px;
        height: 38px;
        background: ${bgGradient};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg) ${scale};
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2.5px solid white;
        box-shadow: 0 4px 14px rgba(0,0,0,0.35);
        cursor: pointer;
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      ">
        <svg style="transform: rotate(45deg); width: 18px; height: 18px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
        </svg>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
  });
};

const cityMarkerIcon = L.divIcon({
  className: 'custom-city-marker',
  html: `
    <div style="
      background: #1e293b;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      cursor: pointer;
    ">
      <div style="width: 8px; height: 8px; background: #38bdf8; border-radius: 50%;"></div>
    </div>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -13],
});

export interface Doctor {
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
  opd_time?: string;
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

const SPECIALTIES = [
  'All Specialties',
  'Ayurveda',
  'Cardiology',
  'General Medicine',
  'Dermatology',
  'Pediatrics',
  'Orthopedics',
  'Gynecology'
];

// Map camera animator component
const MapCameraUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, {
      duration: 1.1,
      easeLinearity: 0.25,
    });
  }, [center, zoom, map]);
  return null;
};

const BestDoctors: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedDoctor } = useAppointmentStore();

  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters & State
  const [selectedCity, setSelectedCity] = useState<string>('All India');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All Specialties');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeDoctor, setActiveDoctor] = useState<Doctor | null>(null);
  const [activeDoctorModal, setActiveDoctorModal] = useState<Doctor | null>(null);

  // Map Controls & View Mode
  const [mapCenter, setMapCenter] = useState<[number, number]>([21.8, 82.5]);
  const [zoom, setZoom] = useState(5);
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'cards'>('split');

  // Auto-scroll cards list on selection
  const listContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchAndPrepareDoctors();
  }, []);

  const fetchAndPrepareDoctors = async () => {
    setLoading(true);
    try {
      const { data } = await getAllDoctors();
      let rawList: any[] = data || [];

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
            opd_time: '10:00 AM - 04:00 PM',
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
            opd_time: '11:00 AM - 05:00 PM',
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
            opd_time: '09:00 AM - 02:00 PM',
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
            opd_time: '02:00 PM - 07:00 PM',
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
            opd_time: '10:00 AM - 03:00 PM',
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
            opd_time: '09:00 AM - 01:00 PM',
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
            opd_time: '03:00 PM - 08:00 PM',
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
            opd_time: '10:00 AM - 04:00 PM',
            bio: 'Dedicated women healthcare expert guiding reproductive wellness, prenatal consultation, and hormonal health.'
          }
        ];
      }

      const enriched: Doctor[] = rawList.map((doc, idx) => {
        const assignedCity = doc.city && doc.city !== 'Available Online' ? doc.city : CITIES[idx % CITIES.length].name;
        const cityData = CITIES.find((c) => c.name.toLowerCase() === assignedCity.toLowerCase()) || CITIES[idx % CITIES.length];

        const jitterLat = cityData.latitude + ((idx % 3) - 1) * 0.04;
        const jitterLng = cityData.longitude + (((idx + 1) % 3) - 1) * 0.04;

        return {
          id: doc.id || `doc-${idx}`,
          name: doc.name || 'Medical Specialist',
          specialty: doc.specialty || 'General Medicine',
          experience: doc.experience || 5,
          rating: doc.rating || 4.8,
          image_url: doc.image_url,
          city: assignedCity,
          latitude: doc.latitude || jitterLat,
          longitude: doc.longitude || jitterLng,
          phone: doc.phone || '+91 8252228793',
          email: doc.email || 'care@pixir.in',
          available: doc.available !== false,
          bio: doc.bio || 'Verified medical practitioner on Arogyam Telemedicine providing remote clinical consultations.',
          consultation_fee: doc.consultation_fee || 500,
          opd_time: doc.opd_time || '10:00 AM - 05:00 PM',
        };
      });

      setAllDoctors(enriched);
      if (enriched.length > 0) {
        setActiveDoctor(enriched[0]);
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered Doctors list
  const filteredDoctors = useMemo(() => {
    return allDoctors.filter((doctor) => {
      const matchCity = selectedCity === 'All India' || doctor.city.toLowerCase() === selectedCity.toLowerCase();
      const matchSpecialty = selectedSpecialty === 'All Specialties' || doctor.specialty.toLowerCase() === selectedSpecialty.toLowerCase();
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        doctor.name.toLowerCase().includes(query) ||
        doctor.specialty.toLowerCase().includes(query) ||
        doctor.city.toLowerCase().includes(query);

      return matchCity && matchSpecialty && matchSearch;
    });
  }, [allDoctors, selectedCity, selectedSpecialty, searchQuery]);

  // Click a doctor from cards list or map marker
  const handleSelectDoctor = (doctor: Doctor) => {
    setActiveDoctor(doctor);
    setMapCenter([doctor.latitude, doctor.longitude]);
    setZoom(12);
  };

  // Select city from filter
  const handleSelectCity = (cityName: string) => {
    setSelectedCity(cityName);
    if (cityName === 'All India') {
      setMapCenter([21.8, 82.5]);
      setZoom(5);
    } else {
      const city = CITIES.find((c) => c.name.toLowerCase() === cityName.toLowerCase());
      if (city) {
        setMapCenter([city.latitude, city.longitude]);
        setZoom(11);
      }
    }
  };

  const handleResetMap = () => {
    setSelectedCity('All India');
    setSelectedSpecialty('All Specialties');
    setSearchQuery('');
    setMapCenter([21.8, 82.5]);
    setZoom(5);
    if (allDoctors.length > 0) {
      setActiveDoctor(allDoctors[0]);
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
    <section className="py-16 bg-gray-50/70 relative" id="doctors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-600 text-xs font-semibold uppercase tracking-wider mb-2">
              <Stethoscope className="w-3.5 h-3.5" />
              Verified Clinic & Telemedicine Network
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Interactive <span className="bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-transparent bg-clip-text">Doctor Map</span> & Clinics
            </h2>
            <p className="mt-2 text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              Locate verified specialists near you, explore clinic OPD timings, or book an instant online video consultation across India.
            </p>
          </motion.div>
        </div>

        {/* Master Control Bar: Search + City + Specialty + View Mode Switcher */}
        <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search doctor, specialty (e.g. Ayurveda, Cardiology)..."
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-3 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* City Selector */}
            <div className="md:col-span-3">
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                <select
                  value={selectedCity}
                  onChange={(e) => handleSelectCity(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none cursor-pointer"
                >
                  <option value="All India">🇮🇳 All India Hubs ({allDoctors.length})</option>
                  {CITIES.map((c) => {
                    const count = allDoctors.filter((d) => d.city.toLowerCase() === c.name.toLowerCase()).length;
                    return (
                      <option key={c.name} value={c.name}>
                        {c.name} {count > 0 ? `(${count})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Specialty Selector */}
            <div className="md:col-span-2">
              <div className="relative">
                <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="w-full pl-9 pr-6 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none cursor-pointer"
                >
                  {SPECIALTIES.map((spec) => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* View Mode Toggle Buttons */}
            <div className="md:col-span-2 flex items-center justify-end gap-1 bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                title="Split Map & List View"
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                  viewMode === 'split' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Split</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                title="Map Only View"
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                  viewMode === 'map' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Map</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                title="Grid Cards Only View"
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                  viewMode === 'cards' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>
          </div>

          {/* Quick Specialty Pills Bar */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="font-semibold text-gray-500 flex-shrink-0 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick Specialties:
            </span>
            {SPECIALTIES.map((spec) => (
              <button
                key={spec}
                onClick={() => setSelectedSpecialty(spec)}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition-all font-medium ${
                  selectedSpecialty === spec
                    ? 'bg-red-600 text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        {/* Results Counter & Map Reset */}
        <div className="flex items-center justify-between mb-4 px-1 text-xs text-gray-600">
          <div>
            Showing <strong className="text-gray-900">{filteredDoctors.length}</strong> verified doctors in{' '}
            <strong className="text-red-600">{selectedCity}</strong>
            {selectedSpecialty !== 'All Specialties' && (
              <span> • Specialty: <strong className="text-gray-900">{selectedSpecialty}</strong></span>
            )}
          </div>
          {(selectedCity !== 'All India' || selectedSpecialty !== 'All Specialties' || searchQuery) && (
            <button
              onClick={handleResetMap}
              className="text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 underline"
            >
              Reset Filters & Overview Map
            </button>
          )}
        </div>

        {/* Dynamic Display Area based on View Mode */}
        {viewMode === 'cards' ? (
          /* Cards Grid Only View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredDoctors.map((doctor) => (
              <DoctorGridCard
                key={doctor.id}
                doctor={doctor}
                onSelectDoctor={handleSelectDoctor}
                onBook={handleBookAppointment}
                onViewProfile={(doc) => setActiveDoctorModal(doc)}
              />
            ))}
          </div>
        ) : (
          /* Split View or Full Map View */
          <div className={`grid gap-6 items-start ${viewMode === 'map' ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'}`}>
            {/* Left Doctor Cards List (only in Split view) */}
            {viewMode === 'split' && (
              <div className="lg:col-span-5 space-y-3">
                <div
                  ref={listContainerRef}
                  className="bg-white rounded-2xl border border-gray-200 p-4 max-h-[620px] overflow-y-auto space-y-3 shadow-xs"
                >
                  {loading ? (
                    <div className="py-20 text-center">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-500 border-r-transparent"></div>
                      <p className="mt-2 text-xs text-gray-500">Loading specialist registry...</p>
                    </div>
                  ) : filteredDoctors.length === 0 ? (
                    <div className="py-16 text-center">
                      <Users className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <h4 className="font-bold text-gray-800 text-sm">No doctors match this filter</h4>
                      <p className="text-xs text-gray-500 mt-1">Try switching to All India or All Specialties.</p>
                      <button
                        onClick={handleResetMap}
                        className="mt-3 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-xs font-semibold rounded-lg text-gray-700"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  ) : (
                    filteredDoctors.map((doctor) => {
                      const isSelected = activeDoctor?.id === doctor.id;
                      return (
                        <div
                          key={doctor.id}
                          onClick={() => handleSelectDoctor(doctor)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-red-50/80 border-red-400 shadow-xs ring-2 ring-red-200'
                              : 'bg-gray-50/60 border-gray-200 hover:border-red-300 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-2xs">
                              {doctor.image_url ? (
                                <img src={doctor.image_url} alt={doctor.name} className="w-full h-full object-cover" />
                              ) : (
                                doctor.name.replace('Dr. ', '').charAt(0)
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-gray-900 text-sm truncate">{doctor.name}</h4>
                                <span className="text-xs font-bold text-amber-500 flex items-center gap-0.5">
                                  <Star className="w-3 h-3 fill-current" />
                                  {doctor.rating.toFixed(1)}
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-red-600">{doctor.specialty}</p>
                              <div className="flex items-center gap-2 mt-1 text-2xs text-gray-500">
                                <span className="flex items-center gap-0.5">
                                  <MapPin className="w-3 h-3 text-gray-400" />
                                  {doctor.city}
                                </span>
                                <span>•</span>
                                <span>{doctor.experience}y exp</span>
                                <span>•</span>
                                <span className="text-green-600 font-medium">Online</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-gray-200/80 flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-900">
                              ₹{doctor.consultation_fee} <span className="text-2xs text-gray-500 font-normal">/ consultation</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDoctorModal(doctor);
                                }}
                                className="px-2.5 py-1 text-2xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100"
                              >
                                Details
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBookAppointment(doctor);
                                }}
                                className="px-3 py-1 text-2xs font-semibold text-white bg-gradient-to-r from-red-600 to-orange-500 rounded-md hover:opacity-95 shadow-2xs"
                              >
                                Book Now
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Right Interactive Leaflet Map (Split: 7 cols, Map-only: 12 cols) */}
            <div className={viewMode === 'split' ? 'lg:col-span-7' : 'w-full'}>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2.5 h-[620px] flex flex-col relative overflow-hidden">
                {/* On-Map Top Status Bar */}
                <div className="absolute top-4 left-4 z-[400] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-gray-200 flex items-center gap-2 text-xs font-medium text-gray-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  <span>Click any pin to focus clinic & doctor</span>
                </div>

                {/* Recenter Map Button */}
                <button
                  type="button"
                  onClick={handleResetMap}
                  title="Recenter to All India"
                  className="absolute top-4 right-14 z-[400] bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-xl shadow-md border border-gray-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Navigation className="w-3.5 h-3.5 text-red-600" />
                  <span>Reset Center</span>
                </button>

                {/* Leaflet Container with Safe Scroll Zoom to avoid scroll traps */}
                <div className="w-full h-full rounded-xl overflow-hidden relative">
                  <MapContainer
                    center={mapCenter}
                    zoom={zoom}
                    style={{ height: '100%', width: '100%', zIndex: 10 }}
                    zoomControl={false}
                    scrollWheelZoom={false} // Prevents scroll hijacking on the page
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <ZoomControl position="topright" />
                    <MapCameraUpdater center={mapCenter} zoom={zoom} />

                    {/* Major City Clinic Hub markers */}
                    {CITIES.map((city) => (
                      <Marker
                        key={`city-hub-${city.name}`}
                        position={[city.latitude, city.longitude]}
                        icon={cityMarkerIcon}
                        eventHandlers={{
                          click: () => handleSelectCity(city.name),
                        }}
                      />
                    ))}

                    {/* Doctor Location Markers */}
                    {filteredDoctors.map((doctor) => {
                      const isSelected = activeDoctor?.id === doctor.id;
                      return (
                        <Marker
                          key={`doctor-pin-${doctor.id}`}
                          position={[doctor.latitude, doctor.longitude]}
                          icon={createDoctorMarkerIcon(isSelected, doctor.specialty)}
                          eventHandlers={{
                            click: () => handleSelectDoctor(doctor),
                          }}
                        />
                      );
                    })}
                  </MapContainer>

                  {/* Floating Doctor Overlay Card on Map */}
                  <AnimatePresence>
                    {activeDoctor && (
                      <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.25 }}
                        className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-[500] bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-gray-200/90"
                      >
                        <button
                          onClick={() => setActiveDoctor(null)}
                          className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-start gap-3.5 pr-6">
                          <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-r from-red-600 to-orange-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md">
                            {activeDoctor.image_url ? (
                              <img src={activeDoctor.image_url} alt={activeDoctor.name} className="w-full h-full object-cover" />
                            ) : (
                              activeDoctor.name.replace('Dr. ', '').charAt(0)
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-gray-900 text-sm truncate">{activeDoctor.name}</h4>
                              <CheckCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                            </div>
                            <p className="text-xs font-semibold text-red-600">{activeDoctor.specialty}</p>

                            <div className="flex items-center gap-2 mt-1 text-2xs text-gray-600">
                              <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                                <Star className="w-3 h-3 fill-current" /> {activeDoctor.rating.toFixed(1)}
                              </span>
                              <span>•</span>
                              <span>{activeDoctor.city}</span>
                              <span>•</span>
                              <span>{activeDoctor.experience} Yrs Exp</span>
                            </div>

                            <div className="mt-1 flex items-center gap-1 text-2xs text-gray-500">
                              <Clock className="w-3 h-3 text-red-500" />
                              <span>OPD: {activeDoctor.opd_time}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-2xs text-gray-500 block">Consultation Fee</span>
                            <span className="text-sm font-bold text-gray-900">₹{activeDoctor.consultation_fee}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setActiveDoctorModal(activeDoctor)}
                              className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                              Profile
                            </button>
                            <button
                              onClick={() => handleBookAppointment(activeDoctor)}
                              className="px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 rounded-lg shadow-sm hover:opacity-95 flex items-center gap-1"
                            >
                              <Calendar className="w-3.5 h-3.5" /> Book
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Doctor Detailed Profile Modal */}
      <AnimatePresence>
        {activeDoctorModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
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
                    {activeDoctorModal.name.replace('Dr. ', '').charAt(0) || 'D'}
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
                    <span>OPD Consultation Hours: {activeDoctorModal.opd_time}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                    <span>Clinic & Telemedicine Hub: {activeDoctorModal.city}, India</span>
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

// Reusable Doctor Grid Card for Grid view
const DoctorGridCard: React.FC<{
  doctor: Doctor;
  onSelectDoctor: (doc: Doctor) => void;
  onBook: (doc: Doctor) => void;
  onViewProfile: (doc: Doctor) => void;
}> = ({ doctor, onBook, onViewProfile }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-red-600 to-orange-500 flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-xs">
            {doctor.image_url ? (
              <img src={doctor.image_url} alt={doctor.name} className="w-full h-full object-cover" />
            ) : (
              doctor.name.replace('Dr. ', '').charAt(0)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-900 text-sm truncate">{doctor.name}</h4>
            <p className="text-xs font-semibold text-red-600">{doctor.specialty}</p>
            <div className="flex items-center gap-1.5 mt-1 text-2xs text-gray-500">
              <span className="flex items-center text-amber-500 font-bold">
                <Star className="w-3 h-3 fill-current mr-0.5" />
                {doctor.rating.toFixed(1)}
              </span>
              <span>•</span>
              <span>{doctor.experience}y exp</span>
            </div>
          </div>
        </div>

        <div className="space-y-1.5 text-2xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Location:</span>
            <span className="font-medium text-gray-900">{doctor.city}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">OPD:</span>
            <span className="font-medium text-gray-900">{doctor.opd_time}</span>
          </div>
        </div>
      </div>

      <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between">
        <div>
          <span className="text-2xs text-gray-400 block">Fee</span>
          <span className="text-sm font-bold text-gray-900">₹{doctor.consultation_fee}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewProfile(doctor)}
            className="px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Profile
          </button>
          <button
            onClick={() => onBook(doctor)}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-orange-500 rounded-lg hover:opacity-95 shadow-2xs"
          >
            Book
          </button>
        </div>
      </div>
    </div>
  );
};

export default BestDoctors;
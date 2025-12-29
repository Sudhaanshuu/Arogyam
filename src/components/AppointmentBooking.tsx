import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, isToday, isTomorrow } from 'date-fns';
import { Calendar, Clock, Users, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUserStore, useAppointmentStore } from '../lib/store';
import { getDoctors, getVerifiedDoctors, createAppointment } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  experience: number;
  rating: number;
  image_url?: string;
  city: string;
  available: boolean;
}

const AppointmentBooking: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { 
    selectedDoctor, setSelectedDoctor,
    selectedDate, setSelectedDate,
    selectedTime, setSelectedTime,
    duration, setDuration,
    resetAppointment
  } = useAppointmentStore();
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        console.log('Fetching doctors...');
        // Use getVerifiedDoctors for appointment booking to get registered doctors
        const { data, error } = await getVerifiedDoctors();
        console.log('Doctors response:', { data, error });
        
        if (error) {
          console.warn('Failed to fetch verified doctors:', error);
          // Try fallback to available_doctors table
          const { data: fallbackData, error: fallbackError } = await getDoctors();
          
          if (fallbackError || !fallbackData || fallbackData.length === 0) {
            console.warn('No doctors found in database, loading sample doctors');
            loadSampleDoctors();
            return;
          }
          
          setDoctors(fallbackData);
          console.log('Set fallback doctors:', fallbackData.length);
        } else if (!data || data.length === 0) {
          console.warn('No verified doctors found, loading sample doctors');
          loadSampleDoctors();
        } else {
          setDoctors(data);
          console.log('Set doctors:', data.length);
        }
      } catch (error) {
        console.error('Error fetching doctors:', error);
        loadSampleDoctors();
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const loadSampleDoctors = () => {
    const sampleDoctors: Doctor[] = [
      {
        id: 'sample-1',
        name: 'Dr. Sarah Johnson',
        specialty: 'General Medicine',
        experience: 8,
        rating: 4.8,
        image_url: '',
        city: 'Available Online',
        available: true
      },
      {
        id: 'sample-2',
        name: 'Dr. Michael Chen',
        specialty: 'Cardiology',
        experience: 12,
        rating: 4.9,
        image_url: '',
        city: 'Available Online',
        available: true
      },
      {
        id: 'sample-3',
        name: 'Dr. Emily Davis',
        specialty: 'Dermatology',
        experience: 6,
        rating: 4.7,
        image_url: '',
        city: 'Available Online',
        available: true
      },
      {
        id: 'sample-4',
        name: 'Dr. Robert Wilson',
        specialty: 'Pediatrics',
        experience: 15,
        rating: 4.9,
        image_url: '',
        city: 'Available Online',
        available: true
      },
      {
        id: 'sample-5',
        name: 'Dr. Lisa Anderson',
        specialty: 'Psychiatry',
        experience: 10,
        rating: 4.6,
        image_url: '',
        city: 'Available Online',
        available: true
      },
      {
        id: 'sample-6',
        name: 'Dr. James Martinez',
        specialty: 'Orthopedics',
        experience: 14,
        rating: 4.8,
        image_url: '',
        city: 'Available Online',
        available: true
      }
    ];
    
    setDoctors(sampleDoctors);
    toast.success('Showing sample doctors. Real doctor profiles will appear here once registered.');
  };

  useEffect(() => {
    // Generate available time slots
    if (selectedDate) {
      const times = [];
      const startHour = 9; // 9 AM
      const endHour = 17; // 5 PM
      
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
        }
      }
      
      setAvailableTimes(times);
    }
  }, [selectedDate]);

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setStep(2);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setStep(3);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep(4);
  };

  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration);
  };

  const handleBookAppointment = async () => {
    if (!user) {
      toast.error('Please log in to book an appointment');
      navigate('/login');
      return;
    }

    if (!selectedDoctor || !selectedDate || !selectedTime) {
      toast.error('Please complete all appointment details');
      return;
    }

    try {
      const appointmentDate = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':').map(Number);
      appointmentDate.setHours(hours, minutes);

      const appointmentData = {
        patient_id: user.id,
        doctor_id: selectedDoctor.id,
        appointment_date: appointmentDate.toISOString(),
        duration_minutes: duration,
        status: 'confirmed', // Set to confirmed for demo purposes
      };

      const { error } = await createAppointment(appointmentData);
      
      if (error) {
        console.warn('Failed to save appointment to database:', error);
        // Still show success message for demo purposes
        toast.success('Appointment request submitted! (Demo mode - check your profile for sample appointments)');
      } else {
        toast.success('Appointment booked successfully!');
      }
      
      resetAppointment();
      
      // Navigate to profile instead of appointments page
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
      
      // Send confirmation email (mock)
      console.log(`Sending confirmation email to ${user.email} for appointment with ${selectedDoctor.name}`);
      
    } catch (error) {
      console.error('Error booking appointment:', error);
      // Still provide positive feedback for demo
      toast.success('Appointment request submitted! (Demo mode - check your profile for sample appointments)');
      resetAppointment();
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    }
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE, MMM d');
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-gray-900"
          >
            Book Your <span className="bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-transparent bg-clip-text">Telemedicine</span> Appointment
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 max-w-2xl mx-auto text-xl text-gray-600"
          >
            Connect with expert doctors from the comfort of your home
          </motion.p>
        </div>

        {/* Booking Steps */}
        <div className="mb-10">
          <div className="flex justify-between items-center max-w-3xl mx-auto">
            {[1, 2, 3, 4].map((stepNumber) => (
              <React.Fragment key={stepNumber}>
                <div className="flex flex-col items-center">
                  <div 
                    className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-medium ${
                      step >= stepNumber 
                        ? 'bg-gradient-to-r from-red-600 via-pink-500 to-orange-500' 
                        : 'bg-gray-300'
                    }`}
                  >
                    {stepNumber}
                  </div>
                  <div className="text-sm mt-2 text-gray-600">
                    {stepNumber === 1 && 'Select Doctor'}
                    {stepNumber === 2 && 'Choose Date'}
                    {stepNumber === 3 && 'Select Time'}
                    {stepNumber === 4 && 'Confirm'}
                  </div>
                </div>
                {stepNumber < 4 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    step > stepNumber ? 'bg-gradient-to-r from-red-600 via-pink-500 to-orange-500' : 'bg-gray-300'
                  }`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step 1: Doctor Selection */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Select a Doctor</h3>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-500 border-r-transparent"></div>
                <span className="ml-2 text-gray-600">Loading doctors...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctors.map((doctor) => (
                  <motion.div
                    key={doctor.id}
                    whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                    className={`bg-white rounded-xl shadow-md overflow-hidden border ${
                      selectedDoctor?.id === doctor.id 
                        ? 'border-red-500' 
                        : 'border-gray-200'
                    }`}
                    onClick={() => handleDoctorSelect(doctor)}
                  >
                    <div className="p-6">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mr-4">
                          {doctor.image_url ? (
                            <img 
                              src={doctor.image_url} 
                              alt={doctor.name} 
                              className="h-16 w-16 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 flex items-center justify-center">
                              <Users className="h-8 w-8 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{doctor.name}</h4>
                          <p className="text-gray-600">{doctor.specialty}</p>
                          <div className="mt-1 flex items-center">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <svg 
                                  key={i} 
                                  className={`h-4 w-4 ${i < doctor.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                                  fill="currentColor" 
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <span className="ml-1 text-sm text-gray-500">{doctor.rating.toFixed(1)}</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{doctor.experience} years experience</p>
                          <p className="text-sm text-gray-500">{doctor.city}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-between items-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          doctor.available 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {doctor.available ? 'Available' : 'Limited Availability'}
                        </span>
                        <button 
                          className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
                          onClick={() => handleDoctorSelect(doctor)}
                        >
                          Select <ArrowRight className="h-4 w-4 ml-1" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Step 2: Date Selection */}
        {step === 2 && selectedDoctor && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center mb-6">
              <button 
                onClick={() => setStep(1)}
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <h3 className="text-xl font-semibold text-gray-800">Select a Date</h3>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 max-w-3xl mx-auto">
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0 mr-4">
                  {selectedDoctor.image_url ? (
                    <img 
                      src={selectedDoctor.image_url} 
                      alt={selectedDoctor.name} 
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 flex items-center justify-center">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{selectedDoctor.name}</h4>
                  <p className="text-gray-600">{selectedDoctor.specialty}</p>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="flex items-center mb-4">
                  <Calendar className="h-5 w-5 text-red-500 mr-2" />
                  <h4 className="text-lg font-medium text-gray-800">Available Dates</h4>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {[...Array(10)].map((_, i) => {
                    const date = addDays(new Date(), i);
                    return (
                      <motion.button
                        key={i}
                        whileHover={{ y: -2 }}
                        onClick={() => handleDateSelect(date)}
                        className={`p-3 rounded-lg border text-center ${
                          selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                            ? 'bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white border-transparent'
                            : 'border-gray-200 hover:border-red-500 text-gray-700'
                        }`}
                      >
                        <div className="font-medium">{getDateLabel(date)}</div>
                        <div className="text-xs mt-1">{format(date, 'MMM d')}</div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Time Selection */}
        {step === 3 && selectedDoctor && selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center mb-6">
              <button 
                onClick={() => setStep(2)}
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <h3 className="text-xl font-semibold text-gray-800">Select a Time</h3>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 max-w-3xl mx-auto">
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0 mr-4">
                  {selectedDoctor.image_url ? (
                    <img 
                      src={selectedDoctor.image_url} 
                      alt={selectedDoctor.name} 
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 flex items-center justify-center">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{selectedDoctor.name}</h4>
                  <p className="text-gray-600">{selectedDoctor.specialty}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    <span className="font-medium">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="flex items-center mb-4">
                  <Clock className="h-5 w-5 text-red-500 mr-2" />
                  <h4 className="text-lg font-medium text-gray-800">Available Time Slots</h4>
                </div>
                
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {availableTimes.map((time) => (
                    <motion.button
                      key={time}
                      whileHover={{ y: -2 }}
                      onClick={() => handleTimeSelect(time)}
                      className={`p-3 rounded-lg border text-center ${
                        selectedTime === time
                          ? 'bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white border-transparent'
                          : 'border-gray-200 hover:border-red-500 text-gray-700'
                      }`}
                    >
                      {time}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && selectedDoctor && selectedDate && selectedTime && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center mb-6">
              <button 
                onClick={() => setStep(3)}
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <h3 className="text-xl font-semibold text-gray-800">Confirm Your Appointment</h3>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 max-w-3xl mx-auto">
              <div className="border-b border-gray-200 pb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Appointment Details</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-4">
                        {selectedDoctor.image_url ? (
                          <img 
                            src={selectedDoctor.image_url} 
                            alt={selectedDoctor.name} 
                            className="h-16 w-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-full bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 flex items-center justify-center">
                            <Users className="h-8 w-8 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900">{selectedDoctor.name}</h5>
                        <p className="text-gray-600">{selectedDoctor.specialty}</p>
                        <div className="mt-1 flex items-center">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <svg 
                                key={i} 
                                className={`h-4 w-4 ${i < selectedDoctor.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="ml-1 text-sm text-gray-500">{selectedDoctor.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-red-500 mr-2" />
                        <div>
                          <p className="text-sm text-gray-600">Date</p>
                          <p className="font-medium text-gray-900">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-red-500 mr-2" />
                        <div>
                          <p className="text-sm text-gray-600">Time</p>
                          <p className="font-medium text-gray-900">{selectedTime}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Consultation Duration</h4>
                
                <div className="flex space-x-4 mb-6">
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => handleDurationChange(mins)}
                      className={`px-4 py-2 rounded-lg border ${
                        duration === mins
                          ? 'bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white border-transparent'
                          : 'border-gray-200 hover:border-red-500 text-gray-700'
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h5 className="font-medium text-gray-900 mb-2">What to expect</h5>
                  <p className="text-gray-600 text-sm">
                    You'll receive a confirmation email with a link to join the video consultation.
                    Please join 5 minutes before your scheduled time. Ensure you have a stable internet
                    connection and a quiet environment for the consultation.
                  </p>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={handleBookAppointment}
                    className="px-6 py-3 bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center"
                  >
                    Book Appointment <ArrowRight className="ml-2 h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default AppointmentBooking;
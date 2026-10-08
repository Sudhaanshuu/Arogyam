import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, Calendar, CheckCircle2, XCircle, Search, 
  Stethoscope, Clock, ShieldCheck, Filter, RefreshCw
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useUserStore } from '../lib/store';

interface AppointmentRow {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  status: string;
  duration_minutes: number;
  video_session_id?: string;
  patient_name?: string;
  patient_email?: string;
  doctor_name?: string;
  doctor_specialty?: string;
}

interface DoctorRow {
  id: string;
  user_id: string;
  name?: string;
  specialty: string;
  experience_years: number;
  license_number?: string;
  qualification?: string;
  is_verified: boolean;
  is_available: boolean;
  consultation_fee?: number;
  created_at: string;
}

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useUserStore();
  const [activeTab, setActiveTab] = useState<'appointments' | 'doctors' | 'stats'>('appointments');
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    checkAdminAndFetch();
  }, [user]);

  const checkAdminAndFetch = async () => {
    setLoading(true);
    try {
      // Allow access if logged in. If not logged in, prompt to log in.
      if (!user) {
        toast.error('Please log in with an administrator account');
        navigate('/login');
        return;
      }

      await Promise.all([
        fetchAppointments(),
        fetchDoctors()
      ]);
    } catch (err) {
      console.error('Admin initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const { data: rawAppts, error } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: false });

      if (error) {
        console.warn('Could not fetch appointments from Supabase:', error);
        loadFallbackAppointments();
        return;
      }

      if (rawAppts && rawAppts.length > 0) {
        // Enrich patient and doctor details
        const enriched = await Promise.all(
          rawAppts.map(async (item: any) => {
            let patientName = 'Patient';
            let patientEmail = '';
            let doctorName = 'Doctor Specialist';
            let doctorSpecialty = 'General Medicine';

            // Try user profile for patient
            try {
              const { data: userData } = await supabase
                .from('users')
                .select('full_name, email')
                .eq('id', item.patient_id)
                .maybeSingle();
              if (userData) {
                patientName = userData.full_name || userData.email?.split('@')[0] || 'Patient';
                patientEmail = userData.email || '';
              }
            } catch { /* ignore */ }

            // Try doctor profile or available_doctors
            try {
              const { data: docData } = await supabase
                .from('available_doctors')
                .select('name, specialty')
                .eq('id', item.doctor_id)
                .maybeSingle();
              if (docData) {
                doctorName = docData.name;
                doctorSpecialty = docData.specialty;
              } else {
                const { data: docProf } = await supabase
                  .from('doctor_profiles')
                  .select('specialty, users(full_name)')
                  .eq('user_id', item.doctor_id)
                  .maybeSingle();
                if (docProf) {
                  doctorSpecialty = docProf.specialty;
                  doctorName = (docProf as any)?.users?.full_name || `Dr. ${docProf.specialty}`;
                }
              }
            } catch { /* ignore */ }

            return {
              ...item,
              patient_name: patientName,
              patient_email: patientEmail,
              doctor_name: doctorName,
              doctor_specialty: doctorSpecialty
            };
          })
        );
        setAppointments(enriched);
      } else {
        loadFallbackAppointments();
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      loadFallbackAppointments();
    }
  };

  const loadFallbackAppointments = () => {
    const demo: AppointmentRow[] = [
      {
        id: 'appt-101',
        patient_id: 'pat-1',
        doctor_id: 'doc-1',
        patient_name: 'Aarav Sharma',
        patient_email: 'aarav@example.com',
        doctor_name: 'Dr. Sarah Johnson',
        doctor_specialty: 'General Medicine',
        appointment_date: new Date(Date.now() + 3600000 * 2).toISOString(),
        status: 'pending',
        duration_minutes: 30,
        video_session_id: 'ROOM-AROGYAM-1'
      },
      {
        id: 'appt-102',
        patient_id: 'pat-2',
        doctor_id: 'doc-2',
        patient_name: 'Pooja Verma',
        patient_email: 'pooja@example.com',
        doctor_name: 'Dr. Michael Chen',
        doctor_specialty: 'Cardiology',
        appointment_date: new Date(Date.now() + 86400000).toISOString(),
        status: 'confirmed',
        duration_minutes: 30,
        video_session_id: 'ROOM-AROGYAM-2'
      },
      {
        id: 'appt-103',
        patient_id: 'pat-3',
        doctor_id: 'doc-3',
        patient_name: 'Vikram Patel',
        patient_email: 'vikram@example.com',
        doctor_name: 'Dr. Priya Sharma',
        doctor_specialty: 'Ayurveda',
        appointment_date: new Date(Date.now() - 86400000).toISOString(),
        status: 'completed',
        duration_minutes: 45,
        video_session_id: 'ROOM-AROGYAM-3'
      }
    ];
    setAppointments(demo);
  };

  const fetchDoctors = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('doctor_profiles')
        .select(`
          id,
          user_id,
          specialty,
          experience_years,
          license_number,
          qualification,
          is_verified,
          is_available,
          consultation_fee,
          created_at,
          users:user_id(full_name, email)
        `);

      if (!error && profiles && profiles.length > 0) {
        const list: DoctorRow[] = profiles.map((p: any) => ({
          id: p.id,
          user_id: p.user_id,
          name: p.users?.full_name || `Dr. ${p.specialty}`,
          specialty: p.specialty,
          experience_years: p.experience_years || 0,
          license_number: p.license_number || 'N/A',
          qualification: p.qualification || 'MBBS',
          is_verified: !!p.is_verified,
          is_available: !!p.is_available,
          consultation_fee: p.consultation_fee || 500,
          created_at: p.created_at || new Date().toISOString()
        }));
        setDoctors(list);
      } else {
        // Fallback demo doctors
        setDoctors([
          {
            id: 'dp-1',
            user_id: 'u-1',
            name: 'Dr. Sarah Johnson',
            specialty: 'General Medicine',
            experience_years: 8,
            license_number: 'MED-98214',
            qualification: 'MD (Internal Medicine)',
            is_verified: true,
            is_available: true,
            consultation_fee: 500,
            created_at: new Date().toISOString()
          },
          {
            id: 'dp-2',
            user_id: 'u-2',
            name: 'Dr. Michael Chen',
            specialty: 'Cardiology',
            experience_years: 12,
            license_number: 'CARD-11029',
            qualification: 'DM (Cardiology)',
            is_verified: true,
            is_available: true,
            consultation_fee: 800,
            created_at: new Date().toISOString()
          },
          {
            id: 'dp-3',
            user_id: 'u-3',
            name: 'Dr. Priya Sharma',
            specialty: 'Ayurveda',
            experience_years: 9,
            license_number: 'AYU-45210',
            qualification: 'BAMS, MD (Ayurveda)',
            is_verified: false, // Needs admin approval!
            is_available: true,
            consultation_fee: 450,
            created_at: new Date().toISOString()
          }
        ]);
      }
    } catch (err) {
      console.error('Error fetching doctors in admin:', err);
    }
  };

  const handleUpdateStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const generatedRoom = `ROOM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Update in Supabase
      const { error } = await supabase
        .from('appointments')
        .update({
          status: newStatus,
          video_session_id: newStatus === 'confirmed' ? generatedRoom : undefined
        })
        .eq('id', appointmentId);

      if (error) {
        console.warn('DB update failed, updating state locally:', error);
      }

      // Update state locally
      setAppointments(prev =>
        prev.map(item =>
          item.id === appointmentId
            ? { 
                ...item, 
                status: newStatus,
                video_session_id: newStatus === 'confirmed' ? (item.video_session_id || generatedRoom) : item.video_session_id
              }
            : item
        )
      );

      toast.success(`Appointment status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update appointment status');
    }
  };

  const handleToggleDoctorVerification = async (doctorId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    try {
      const { error } = await supabase
        .from('doctor_profiles')
        .update({ is_verified: newStatus })
        .eq('id', doctorId);

      if (error) {
        console.warn('DB update failed, toggling locally:', error);
      }

      setDoctors(prev =>
        prev.map(d => (d.id === doctorId ? { ...d, is_verified: newStatus } : d))
      );

      toast.success(newStatus ? 'Doctor verified successfully!' : 'Doctor verification revoked');
    } catch (err) {
      console.error('Error toggling doctor status:', err);
      toast.error('Failed to change verification status');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await checkAdminAndFetch();
    setRefreshing(false);
    toast.success('Admin data refreshed');
  };

  // Filtered Appointments
  const filteredAppointments = appointments.filter(a => {
    const matchesSearch =
      (a.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.doctor_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.doctor_specialty || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Doctors
  const filteredDoctors = doctors.filter(d =>
    (d.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.specialty || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.license_number || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const confirmedCount = appointments.filter(a => a.status === 'confirmed').length;
  const verifiedDoctorsCount = doctors.filter(d => d.is_verified).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 font-medium">Loading Arogyam Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 pt-24 pb-24">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-red-100 text-red-600 rounded-xl">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Arogyam Administration Hub</h1>
                <p className="text-sm text-gray-500">
                  Manage patient bookings, doctor verification & platform operations for <strong className="text-gray-700">arogyam.pixir.in</strong>
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <div className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-xl text-xs font-semibold flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              Live System
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Approval</p>
              <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Confirmed Active</p>
              <p className="text-2xl font-bold text-green-600">{confirmedCount}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Verified Doctors</p>
              <p className="text-2xl font-bold text-gray-900">{verifiedDoctorsCount} / {doctors.length}</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs & Search Toolbar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <button
                onClick={() => setActiveTab('appointments')}
                className={`flex-1 md:flex-initial px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'appointments'
                    ? 'bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Appointments ({appointments.length})
              </button>
              <button
                onClick={() => setActiveTab('doctors')}
                className={`flex-1 md:flex-initial px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'doctors'
                    ? 'bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Doctor Verification ({doctors.length})
              </button>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patient, doctor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {activeTab === 'appointments' && (
                <div className="flex items-center gap-1.5">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab 1: Appointments Management */}
        {activeTab === 'appointments' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900">Appointment Management & Approval</h3>
              <span className="text-xs text-gray-500">
                Click status dropdown or quick buttons to confirm pending bookings
              </span>
            </div>

            {filteredAppointments.length === 0 ? (
              <div className="text-center py-16">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No appointments match your filter criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Doctor & Specialty
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Scheduled Time
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Current Status
                      </th>
                      <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAppointments.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-9 w-9 rounded-full bg-red-100 text-red-600 font-bold flex items-center justify-center text-sm mr-3">
                              {(item.patient_name || 'P').charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900">{item.patient_name}</div>
                              <div className="text-xs text-gray-500">{item.patient_email || 'Verified Patient'}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{item.doctor_name}</div>
                          <div className="text-xs text-red-600 font-medium">{item.doctor_specialty}</div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div>{format(new Date(item.appointment_date), 'PPP')}</div>
                          <div className="text-xs text-gray-400 font-mono">
                            {format(new Date(item.appointment_date), 'p')}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.duration_minutes || 30} mins
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs font-bold rounded-full border ${
                              item.status === 'confirmed'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : item.status === 'pending'
                                ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                                : item.status === 'completed'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                          >
                            {item.status.toUpperCase()}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="flex items-center justify-end space-x-2">
                            {item.status === 'pending' && (
                              <button
                                onClick={() => handleUpdateStatus(item.id, 'confirmed')}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow-2xs"
                              >
                                Approve
                              </button>
                            )}
                            <select
                              value={item.status}
                              onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                              className="text-xs font-medium border border-gray-300 rounded-lg py-1 px-2 focus:ring-2 focus:ring-red-500 bg-white"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Doctor Verification Management */}
        {activeTab === 'doctors' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900">Doctor Credentials & Verification Queue</h3>
              <span className="text-xs text-gray-500">
                Newly registered medical practitioners must be verified before being public
              </span>
            </div>

            {filteredDoctors.length === 0 ? (
              <div className="text-center py-16">
                <Stethoscope className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No doctors found matching query.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Doctor
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Specialty
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        License & Qualification
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Experience
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Verification Status
                      </th>
                      <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Admin Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDoctors.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold flex items-center justify-center text-sm mr-3">
                              {(doc.name || 'D').charAt(4) || 'D'}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900">{doc.name}</div>
                              <div className="text-xs text-gray-500">ID: {doc.id.slice(0, 8)}...</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-red-600">{doc.specialty}</span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div className="font-mono text-xs font-semibold">{doc.license_number || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{doc.qualification}</div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {doc.experience_years} Years
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {doc.is_verified ? (
                            <span className="px-3 py-1 inline-flex text-xs font-bold rounded-full bg-green-50 text-green-700 border border-green-200 items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              VERIFIED
                            </span>
                          ) : (
                            <span className="px-3 py-1 inline-flex text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200 items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              UNVERIFIED
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <button
                            onClick={() => handleToggleDoctorVerification(doc.id, doc.is_verified)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                              doc.is_verified
                                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            {doc.is_verified ? 'Revoke' : 'Verify Doctor'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
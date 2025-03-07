import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Calendar, MessageSquare, Settings, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface Appointment {
  id: string;
  user: {
    name: string;
    email: string;
  };
  doctor: {
    name: string;
    specialty: string;
  };
  appointment_date: string;
  status: string;
  duration_minutes: number;
}

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    if (isAdmin) {
      fetchAppointments();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        navigate('/');
        toast.error('Unauthorized access');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/');
    }
  };

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          status,
          duration_minutes,
          users:user_id (name, email),
          doctors:doctor_id (name, specialty)
        `)
        .order('appointment_date', { ascending: false });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      toast.success('Appointment status updated');
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Failed to update appointment');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[
                { title: 'Total Appointments', value: appointments.length, icon: Calendar },
                { title: 'Active Doctors', value: '15', icon: Users },
                { title: 'Pending Messages', value: '24', icon: MessageSquare },
                { title: 'System Status', value: 'Online', icon: Settings },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white p-6 rounded-lg shadow border border-gray-100"
                >
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-red-100 mr-4">
                      <stat.icon className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{stat.title}</p>
                      <p className="text-xl font-semibold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Recent Appointments</h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search appointments..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {appointment.user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {appointment.user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{appointment.doctor.name}</div>
                        <div className="text-sm text-gray-500">{appointment.doctor.specialty}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(appointment.appointment_date), 'PPP')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(appointment.appointment_date), 'p')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {appointment.duration_minutes} minutes
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <select
                          onChange={(e) => updateAppointmentStatus(appointment.id, e.target.value)}
                          value={appointment.status}
                          className="text-sm border border-gray-300 rounded-md p-1"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
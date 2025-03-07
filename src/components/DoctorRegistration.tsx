import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Stethoscope, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface DoctorRegistrationForm {
  email: string;
  password: string;
  name: string;
  specialty: string;
  experience: number;
  qualification: string;
  licenseNumber: string;
  bio: string;
}

const DoctorRegistration: React.FC = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<DoctorRegistrationForm>();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: DoctorRegistrationForm) => {
    setLoading(true);
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: 'doctor'
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create doctor profile
        const { error: profileError } = await supabase
          .from('doctor_profiles')
          .insert({
            id: authData.user.id,
            name: data.name,
            specialty: data.specialty,
            experience: data.experience,
            qualification: data.qualification,
            license_number: data.licenseNumber,
            bio: data.bio
          });

        if (profileError) throw profileError;

        toast.success('Registration successful! Please verify your email.');
        navigate('/verify-email');
      }
    } catch (error) {
      console.error('Error registering doctor:', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-lg border border-white/20"
        >
          <div className="flex justify-center mb-8">
            <div className="p-3 rounded-full bg-gradient-to-r from-red-600 via-pink-500 to-orange-500">
              <Stethoscope className="h-12 w-12 text-white" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-center text-white mb-2">
            Doctor Registration
          </h2>
          <p className="text-gray-300 text-center mb-8">
            Join our network of healthcare professionals
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  {...register('name', { required: 'Name is required' })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters'
                    }
                  })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Specialty
                </label>
                <input
                  type="text"
                  {...register('specialty', { required: 'Specialty is required' })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                />
                {errors.specialty && (
                  <p className="mt-1 text-sm text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.specialty.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Years of Experience
                </label>
                <input
                  type="number"
                  {...register('experience', {
                    required: 'Experience is required',
                    min: { value: 0, message: 'Experience cannot be negative' }
                  })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                />
                {errors.experience && (
                  <p className="mt-1 text-sm text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.experience.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Qualification
                </label>
                <input
                  type="text"
                  {...register('qualification', { required: 'Qualification is required' })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                />
                {errors.qualification && (
                  <p className="mt-1 text-sm text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.qualification.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  License Number
                </label>
                <input
                  type="text"
                  {...register('licenseNumber', { required: 'License number is required' })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                />
                {errors.licenseNumber && (
                  <p className="mt-1 text-sm text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.licenseNumber.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Professional Bio
              </label>
              <textarea
                {...register('bio', {
                  required: 'Bio is required',
                  minLength: { value: 100, message: 'Bio must be at least 100 characters' }
                })}
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
              />
              {errors.bio && (
                <p className="mt-1 text-sm text-red-400 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.bio.message}
                </p>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white font-semibold rounded-lg transition-all hover:opacity-90 flex items-center justify-center"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Register as Doctor'
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default DoctorRegistration;
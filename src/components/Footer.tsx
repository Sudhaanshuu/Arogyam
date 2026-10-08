import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Mail, Phone, MapPin, Instagram, Github, Linkedin } from 'lucide-react';

const socialLinks = [
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/pixir.in/',
    icon: (className: string) => <Instagram className={className} />,
  },
  {
    name: 'GitHub',
    url: 'https://github.com/sudhaanshuu',
    icon: (className: string) => <Github className={className} />,
  },
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/in/sudhanshuu/',
    icon: (className: string) => <Linkedin className={className} />,
  },
  {
    name: 'X',
    url: 'https://x.com/sudhan_shuu',
    icon: (className: string) => (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
];

const Footer: React.FC = () => {
  return (
    <footer className="bg-white text-gray-900 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-transparent bg-clip-text">
                Arogyam
              </span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold">
                pixir.in
              </span>
            </Link>
            <p className="mt-4 text-gray-600 text-sm">
              Advanced telemedicine platform by <a href="https://pixir.in" target="_blank" rel="noreferrer" className="text-red-600 font-semibold hover:underline">pixir.in</a>, connecting patients with verified doctors and authentic Ayurvedic medicines.
            </p>
            <div className="mt-6 flex items-center space-x-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={social.name}
                  className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gradient-to-r hover:from-red-600 hover:to-orange-500 text-gray-600 hover:text-white flex items-center justify-center transition-all duration-200 shadow-2xs hover:scale-110"
                >
                  <span className="sr-only">{social.name}</span>
                  {social.icon('w-4 h-4')}
                </a>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-600 hover:text-gray-900 transition-colors">About Us</Link>
              </li>
              <li>
                <Link to="/services" className="text-gray-600 hover:text-gray-900 transition-colors">Services</Link>
              </li>
              <li>
                <Link to="/doctors" className="text-gray-600 hover:text-gray-900 transition-colors">Find Doctors</Link>
              </li>
              <li>
                <Link to="/medicines" className="text-gray-600 hover:text-gray-900 transition-colors">Medicines</Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">Contact Us</Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/telemedicine" className="text-gray-600 hover:text-gray-900 transition-colors">Telemedicine</Link>
              </li>
              <li>
                <Link to="/appointments" className="text-gray-600 hover:text-gray-900 transition-colors">Appointment Booking</Link>
              </li>
              <li>
                <Link to="/medicines" className="text-gray-600 hover:text-gray-900 transition-colors">Ayurvedic Medicines</Link>
              </li>
              <li>
                <Link to="/messages" className="text-gray-600 hover:text-gray-900 transition-colors">Doctor Consultations</Link>
              </li>
              <li>
                <Link to="/news" className="text-gray-600 hover:text-gray-900 transition-colors">Health News</Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-600 hover:text-gray-900 transition-colors">FAQs</Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">
                  Retang, Mahura<br />
                  Bhubanewsar, Odisha 752054
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                <span className="text-gray-600">+91 8252228793</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                <span className="text-gray-600">sudhaanshuu@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 text-sm">
            &copy; {new Date().getFullYear()} Arogyam (arogyam.pixir.in). Part of Pixir. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <Link to="/privacy" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
              Terms of Service
            </Link>
            <Link to="/sitemap" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
              Sitemap
            </Link>
          </div>
        </div>
        
        <div className="mt-6 text-center text-gray-600 text-sm flex items-center justify-center">
          <span>Made with</span>
          <Heart className="h-4 w-4 text-red-500 mx-1" />
          <span>for rural healthcare</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
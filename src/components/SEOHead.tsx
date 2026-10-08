import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface RouteSEO {
  title: string;
  description: string;
}

const routeMetadata: Record<string, RouteSEO> = {
  '/': {
    title: 'Arogyam - Telemedicine & Online Doctor Consultation | pixir.in',
    description: 'Arogyam by pixir.in connects patients across India with verified specialist doctors, live HD video consultations, Ayurvedic medicine search, and clinic discovery.',
  },
  '/appointments': {
    title: 'Book Doctor Appointment Online | Arogyam - pixir.in',
    description: 'Schedule in-person or video consultations with top cardiologists, dermatologists, pediatricians, and Ayurvedic doctors on Arogyam.',
  },
  '/doctors': {
    title: 'Find Specialist Doctors & Clinics Near You | Arogyam - pixir.in',
    description: 'Explore verified doctors, map locations, OPD timings, ratings, and specialties across Bhubaneswar, Delhi, Mumbai, and all over India.',
  },
  '/medicines': {
    title: 'Ayurvedic Medicine Search & Availability | Arogyam - pixir.in',
    description: 'Search authentic Ayurvedic herbal formulations, compare prices, check clinic stock, and submit delivery inquiries online.',
  },
  '/video-consultation': {
    title: 'Live HD Video Consultation Room | Arogyam - pixir.in',
    description: 'Join encrypted, private telemedicine consultations with your doctor directly in your browser. High-quality audio and video powered by Agora.',
  },
  '/video-call': {
    title: 'Live HD Video Consultation Room | Arogyam - pixir.in',
    description: 'Join encrypted, private telemedicine consultations with your doctor directly in your browser.',
  },
  '/messages': {
    title: 'Doctor Patient Medical Messaging | Arogyam - pixir.in',
    description: 'Communicate securely with your doctor, share lab reports, clarify prescriptions, and receive clinical follow-up advice.',
  },
  '/profile': {
    title: 'My Medical Profile & Consultation Dashboard | Arogyam - pixir.in',
    description: 'View scheduled appointments, video room links, medical history, and profile settings on Arogyam.',
  },
  '/admin': {
    title: 'Arogyam Administration & Doctor Verification Portal | pixir.in',
    description: 'Administrative portal for managing appointments, verifying doctor medical licenses, and monitoring platform analytics.',
  },
  '/doctor-registration': {
    title: 'Doctor Registration & Medical Council Onboarding | Arogyam - pixir.in',
    description: 'Register as a licensed healthcare professional or Ayurvedic doctor on Arogyam and provide telemedicine consultations to patients nationwide.',
  },
  '/login': {
    title: 'Sign In to Your Health Account | Arogyam - pixir.in',
    description: 'Access your patient portal, doctor dashboard, and upcoming medical consultations securely.',
  },
  '/signup': {
    title: 'Create an Arogyam Account | Arogyam - pixir.in',
    description: 'Register for free online doctor consultations, instant appointment booking, and Ayurvedic medicine tracking.',
  },
};

export const SEOHead: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const currentMeta = routeMetadata[location.pathname] || {
      title: 'Arogyam - Telemedicine & Online Healthcare | pixir.in',
      description: 'Telemedicine, doctor appointments, and Ayurvedic healthcare by pixir.in.',
    };

    // Update document title
    document.title = currentMeta.title;

    // Update or insert meta description
    let descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) {
      descMeta.setAttribute('content', currentMeta.description);
    }

    // Update OpenGraph title and description
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', currentMeta.title);
    }
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
      ogDesc.setAttribute('content', currentMeta.description);
    }

    // Update Canonical URL
    const canonical = document.querySelector('link[rel="canonical"]');
    const targetUrl = `https://arogyam.pixir.in${location.pathname === '/' ? '/' : location.pathname}`;
    if (canonical) {
      canonical.setAttribute('href', targetUrl);
    }
  }, [location.pathname]);

  return null;
};

export default SEOHead;

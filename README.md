# Arogyam-Kiosk

Arogyam Kiosk is a futuristic, modern sci-fi themed web application designed to help rural communities book telemedicine appointments with doctors. The platform provides essential healthcare features, including video consultations, medicine searches, and doctor messaging, all within a simple and functional UI.

## Features

- **User Authentication**: Secure login, signup, and email verification using Supabase.
- **Hero Section**: A welcoming homepage with an introduction to the platform.
- **Service Cards**: Hover-enabled cards displaying key services.
- **Medicine Search**: Search for Ayurvedic and general medicines.
- **Best Doctors**: Find top-rated doctors with city-based location filtering.
- **Appointment Booking**: Schedule telemedicine appointments with available doctors.
- **News Slider**: Stay updated with trending health-related news.
- **Messaging System**: Communicate with doctors for queries.
- **Video Consultation**: Conduct telemedicine video calls via Agora.
- **Chatbot Support**: AI-powered chatbot using Hugging Face API for healthcare queries.
- **Contact Form**: Integrated with Formspree for user inquiries.
- **Profile Dashboard**: View upcoming appointments and user details.

## Tech Stack

- **Frontend**: React (TypeScript), React Router, Tailwind CSS
- **Backend**: Supabase (Authentication & Database)
- **Video Calls**: Agora SDK
- **Messaging & AI**: Hugging Face API for chatbot, basic messaging system
- **Forms**: Formspree (Contact Us page)
- **Notifications**: React Hot Toast for alerts

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sudhaanshuu/arogyam.git
   cd arogyam
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (create a `.env` file):
   ```plaintext
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   REACT_APP_AGORA_APP_ID=your_agora_app_id
   ```
4. Run the development server:
   ```bash
   npm start
   ```

## Folder Structure

```
Arogyam-Kiosk/
│── src/
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── Hero.tsx
│   │   ├── ServiceCards.tsx
│   │   ├── MedicineSearch.tsx
│   │   ├── BestDoctors.tsx
│   │   ├── AppointmentBooking.tsx
│   │   ├── NewsSlider.tsx
│   │   ├── Messaging.tsx
│   │   ├── Chatbot.tsx
│   │   ├── VideoCallFeature.tsx
│   │   ├── ContactUs.tsx
│   │   ├── Footer.tsx
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── Profile.tsx
│   │   ├── VerifyEmail.tsx
│   ├── App.tsx
│   ├── index.tsx
│── public/
│── package.json
│── README.md
```

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

This project is licensed under the MIT License. Feel free to use and modify it as needed.

---

**Developed for Arogyam Kiosk Bringing Healthcare to Rural Communities** 🚀


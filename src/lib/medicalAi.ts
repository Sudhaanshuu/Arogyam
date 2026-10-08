// Medical AI and Intelligent Health Assistant for Arogyam
// Supports Gemini, Groq, OpenAI, Hugging Face Router, and offline Medical Knowledge Engine

interface ChatMessage {
  text: string;
  isBot: boolean;
  error?: boolean;
}

// Emergency keywords that require immediate medical attention
const EMERGENCY_KEYWORDS = [
  'chest pain', 'heart attack', 'cannot breathe', 'hard to breathe', 'unconscious',
  'stroke', 'paralysis', 'heavy bleeding', 'severe burns', 'poison', 'overdose',
  'coughing blood', 'choking', 'seizure', 'collapsed'
];

// Curated medical knowledge base for common symptoms and queries
interface MedicalEntry {
  keywords: string[];
  specialty: string;
  response: string;
  remedies?: string[];
  medicines?: string[];
}

const MEDICAL_KNOWLEDGE_BASE: MedicalEntry[] = [
  {
    keywords: ['fever', 'temperature', 'chills', 'body heat', 'viral'],
    specialty: 'General Medicine',
    response: `🌡️ **Fever Guidance:**
A fever is usually your immune system fighting an infection.
• Stay hydrated with warm fluids, coconut water, and soups.
• Rest adequately and keep a log of your body temperature.
• If temperature exceeds 102°F (38.9°C) or lasts more than 3 days, consult a physician immediately.`,
    remedies: ['Giloy decoction for immune support', 'Tulsi & Ginger tea', 'Cold sponge compress on forehead'],
    medicines: ['Giloy Juice', 'Tulsi Drops', 'Chyawanprash']
  },
  {
    keywords: ['headache', 'migraine', 'head ache', 'throbbing head'],
    specialty: 'Neurology / General Medicine',
    response: `🧠 **Headache Relief:**
Headaches often stem from stress, dehydration, eye strain, lack of sleep, or migraine.
• Drink 2 glasses of water right away and rest in a quiet, dark room.
• Reduce screen time and practice gentle neck stretches.
• Seek urgent care if accompanied by blurred vision, sudden stiffness in neck, or severe vomiting.`,
    remedies: ['Brahmi & Shankhpushpi tea for mental tension', 'Warm ginger tea', 'Gentle temple massage with peppermint oil'],
    medicines: ['Brahmi Tablets', 'Ashwagandha Capsules']
  },
  {
    keywords: ['cough', 'cold', 'sore throat', 'runny nose', 'congestion', 'sneezing', 'phlegm'],
    specialty: 'General Medicine / ENT',
    response: `🫁 **Cough & Cold Care:**
Most upper respiratory infections are viral and self-limiting.
• Salt water gargle 3 times daily for throat irritation.
• Steam inhalation with a drop of eucalyptus oil clears nasal passages.
• Drink warm water throughout the day; avoid chilled beverages.`,
    remedies: ['Turmeric milk (Golden milk) with black pepper', 'Honey and ginger juice mix', 'Tulsi and cloves herbal brew'],
    medicines: ['Tulsi Drops', 'Haridra Capsules', 'Chyawanprash']
  },
  {
    keywords: ['stomach', 'acidity', 'gas', 'indigestion', 'bloating', 'constipation', 'diarrhea', 'belly pain'],
    specialty: 'Gastroenterology / Ayurveda',
    response: `🥣 **Digestive Health:**
Digestive discomfort is often linked to irregular meals, spicy diet, or weakened digestive fire (Agni).
• Eat light, warm meals like Khichdi or vegetable broth.
• Avoid fried, oily, and heavy dairy products for 48 hours.
• Maintain hydration with ORS, buttermilk (chaas), or cumin water.`,
    remedies: ['Warm water with roasted cumin (Jeera) & fennel (Saunf)', 'Triphala churna before sleep for bowel health', 'Fresh ginger slice with rock salt before meals'],
    medicines: ['Triphala Churna', 'Amla Juice']
  },
  {
    keywords: ['skin', 'rash', 'itching', 'acne', 'pimple', 'allergy', 'eczema', 'fungal'],
    specialty: 'Dermatology',
    response: `🌿 **Skin & Dermatological Care:**
Skin flare-ups can indicate environmental allergies, fungal infections, or internal heat.
• Keep the affected area clean and dry with mild soap.
• Avoid scratching to prevent secondary bacterial infection.
• Stay hydrated and avoid excessively spicy foods.`,
    remedies: ['Neem water rinse for natural antibacterial cleansing', 'Fresh Aloe Vera gel application', 'Blood-purifying turmeric intake'],
    medicines: ['Neem Capsules', 'Haridra Capsules']
  },
  {
    keywords: ['stress', 'anxiety', 'sleep', 'insomnia', 'depression', 'panic', 'tension', 'restless'],
    specialty: 'Psychiatry / Holistic Wellness',
    response: `🌸 **Stress & Sleep Wellness:**
Mental health is as critical as physical health.
• Practice 4-7-8 deep breathing: inhale 4s, hold 7s, exhale 8s.
• Keep screens away at least 1 hour before bedtime.
• A 15-minute daily walk in natural sunlight helps regulate circadian rhythm.`,
    remedies: ['Ashwagandha with warm milk before bedtime', 'Brahmi tea in the evening', 'Chamomile or warm cardamom milk'],
    medicines: ['Ashwagandha Capsules', 'Brahmi Tablets']
  },
  {
    keywords: ['blood pressure', 'hypertension', 'heart', 'cholesterol', 'bp'],
    specialty: 'Cardiology',
    response: `❤️ **Cardiovascular & BP Health:**
Cardiovascular wellness requires regular monitoring and dietary mindfulness.
• Monitor your blood pressure regularly and log the readings.
• Limit dietary sodium (salt) to under 1 teaspoon daily.
• Include 30 minutes of brisk walking or light cardio daily.
• Always consult a cardiologist before altering any prescribed medication.`,
    remedies: ['Arjuna bark tea for cardiac vitality', 'Garlic cloves with warm water in the morning', 'Flaxseeds rich in Omega-3'],
    medicines: ['Arjuna Tablets']
  },
  {
    keywords: ['diabetes', 'sugar', 'glucose', 'insulin'],
    specialty: 'Endocrinology / Ayurveda',
    response: `🩸 **Blood Sugar Management:**
Managing glucose levels requires balanced meals, glycemic control, and routine physical activity.
• Eat high-fiber foods: leafy greens, whole grains, and legumes.
• Avoid refined sugars, sweetened beverages, and bakery carbs.
• Check fasting and postprandial glucose levels regularly.`,
    remedies: ['Karela (Bitter Gourd) and Jamun juice in the morning', 'Methi (fenugreek) seeds soaked in water overnight', 'Amla powder with turmeric'],
    medicines: ['Karela Juice', 'Amla Juice']
  },
  {
    keywords: ['joint', 'knee', 'back pain', 'arthritis', 'bone', 'muscle pain'],
    specialty: 'Orthopedics / Physiotherapy',
    response: `🦴 **Joint & Muscle Care:**
Joint stiffness and back pain are commonly caused by poor posture, lack of mobility, or inflammation.
• Practice gentle stretching and avoid prolonged static sitting.
• Apply warm sesame or mustard oil to aching joints.
• Ensure adequate Vitamin D and Calcium intake through diet and sunlight.`,
    remedies: ['Mahanarayan or Sesame oil warm massage', 'Turmeric and ginger decoction', 'Warm water soak with Epsom salts'],
    medicines: ['Haridra Capsules', 'Shilajit Resin']
  }
];

export async function askMedicalAi(userInput: string, history: ChatMessage[] = []): Promise<string> {
  const query = userInput.trim().toLowerCase();

  // 1. Check for emergency keywords immediately
  for (const keyword of EMERGENCY_KEYWORDS) {
    if (query.includes(keyword)) {
      return `🚨 **MEDICAL EMERGENCY ALERT**
Your message indicates symptoms that may require urgent medical intervention.

**IMMEDIATE STEPS:**
1. Call National Emergency Services: **108** or **112** (India) immediately.
2. If experiencing acute chest pain, breathlessness, or collapse, do not drive yourself. Have someone take you to the nearest Emergency Room.
3. Telemedicine consultations are intended for non-emergency medical care only.

Please contact local emergency medical services right away.`;
    }
  }

  // 2. Try external AI API providers if keys are configured in environment
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const groqKey = import.meta.env.VITE_GROQ_API_KEY;
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const hfKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;

  // Attempt Google Gemini if configured
  if (geminiKey && geminiKey !== 'your_gemini_api_key') {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `You are the Arogyam Virtual Medical Doctor Assistant on arogyam.pixir.in.
Provide concise, empathetic, medically accurate health guidance in 2-3 short paragraphs with bullet points.
Always specify:
1. Likely causes or symptom insights
2. Home care & traditional/Ayurvedic wellness tips
3. Which medical specialist to consult on Arogyam (e.g. General Physician, Cardiologist, Dermatologist)
4. A friendly reminder to book a consultation on Arogyam if symptoms persist.
User Query: ${userInput}`
                  }
                ]
              }
            ],
            generationConfig: { maxOutputTokens: 500, temperature: 0.7 }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) return candidate.trim();
      }
    } catch (err) {
      console.warn('Gemini API call skipped/failed:', err);
    }
  }

  // Attempt Groq if configured
  if (groqKey && groqKey !== 'your_groq_api_key') {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are the Arogyam Telemedicine Health Assistant on arogyam.pixir.in. Provide helpful, safe medical advice and suggest booking consultations with Arogyam doctors.'
            },
            { role: 'user', content: userInput }
          ],
          max_tokens: 450,
          temperature: 0.7
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) return text.trim();
      }
    } catch (err) {
      console.warn('Groq API call skipped/failed:', err);
    }
  }

  // Attempt OpenAI if configured
  if (openaiKey && openaiKey !== 'your_openai_api_key') {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are Arogyam Medical Assistant for arogyam.pixir.in. Provide safe, empathetic healthcare guidance and guide patients to book consultations.'
            },
            { role: 'user', content: userInput }
          ],
          max_tokens: 400
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) return text.trim();
      }
    } catch (err) {
      console.warn('OpenAI API call skipped/failed:', err);
    }
  }

  // Attempt Hugging Face router if key is configured
  if (hfKey && hfKey.startsWith('hf_')) {
    try {
      const response = await fetch(
        'https://router.huggingface.co/hf-inference/models/meta-llama/Llama-3.2-1B-Instruct',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hfKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: `Answer briefly as Arogyam Medical Doctor Assistant: ${userInput}`,
            parameters: { max_new_tokens: 250, temperature: 0.7 }
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;
        if (text && text.length > 20) {
          return text.replace(`Answer briefly as Arogyam Medical Doctor Assistant: ${userInput}`, '').trim();
        }
      }
    } catch (err) {
      console.warn('Hugging Face Router API fallback:', err);
    }
  }

  // 3. Fallback: Arogyam Intelligent Medical Knowledge Engine
  for (const entry of MEDICAL_KNOWLEDGE_BASE) {
    if (entry.keywords.some(k => query.includes(k))) {
      let reply = entry.response;
      if (entry.remedies && entry.remedies.length > 0) {
        reply += `\n\n🌿 **Natural Home & Ayurvedic Care:**\n` + entry.remedies.map(r => `• ${r}`).join('\n');
      }
      if (entry.medicines && entry.medicines.length > 0) {
        reply += `\n\n💊 **Suggested Ayurvedic Medicines on Arogyam:**\n` + entry.medicines.map(m => `• ${m}`).join('\n');
      }
      reply += `\n\n👨‍⚕️ **Recommended Specialist:** *${entry.specialty}*\nYou can easily book a video consultation with our verified doctors under **"Book Appointment"** or find clinic locations in **"Find Doctors"**.`;
      return reply;
    }
  }

  // 4. Platform Queries & General Assistance
  if (query.includes('appointment') || query.includes('book') || query.includes('schedule')) {
    return `📅 **How to Book an Appointment on Arogyam:**
1. Navigate to **"Appointments"** or **"Find Doctors"** from the top bar.
2. Select your desired doctor or specialty.
3. Pick a convenient date and time slot.
4. Confirm your booking!
5. Join the secure video consultation from your **Profile** page when scheduled.`;
  }

  if (query.includes('medicine') || query.includes('tablet') || query.includes('ayurveda') || query.includes('herbal')) {
    return `💊 **Ayurvedic Medicine Search on Arogyam:**
• Visit the **"Medicines"** tab in the navigation bar to search authentic Ayurvedic medicines like Ashwagandha, Triphala, Giloy, and Chyawanprash.
• Check real-time stock availability, composition, and pricing.
• You can also consult our Ayurvedic doctors for tailored prescriptions.`;
  }

  if (query.includes('video') || query.includes('call') || query.includes('consultation')) {
    return `📹 **Video Consultations on Arogyam:**
• Arogyam provides high-definition, private telemedicine video consultations directly in your browser.
• Once your doctor confirms your appointment, click **"Join Video Call"** in your Profile or enter the Room ID on the Video Call page.
• No extra downloads needed!`;
  }

  if (query.includes('fee') || query.includes('cost') || query.includes('price') || query.includes('charge')) {
    return `💳 **Consultation Fees:**
• General consultations on Arogyam start from ₹450 - ₹800 depending on doctor qualification and specialty.
• You can view each doctor's exact consultation fee on their profile card before booking.`;
  }

  if (query.includes('doctor') || query.includes('specialist') || query.includes('register')) {
    return `👨‍⚕️ **Doctors on Arogyam:**
• We host verified specialists across General Medicine, Cardiology, Dermatology, Pediatrics, Orthopedics, Neurology, and Ayurveda.
• Are you a qualified medical practitioner? You can click **"Doctor Registration"** to join our telemedicine network!`;
  }

  if (query.includes('hello') || query.includes('hi') || query.includes('namaste') || query.includes('hey')) {
    return `Namaste! 🙏 I am your **Arogyam Health Assistant**.
How can I assist your health today?
• Describe symptoms (e.g. fever, headache, cough, stomach pain, back pain)
• Ask about Ayurvedic medicines & remedies
• Inquire about doctor appointments or video consultations`;
  }

  // Default comprehensive helpful response
  return `🩺 **Arogyam Health Assistant:**
I am here to support your health and telemedicine journey on **arogyam.pixir.in**.

You can ask me about:
• **Symptoms & Triage:** Fever, cough, headache, digestion, BP, skin issues, etc.
• **Specialist Recommendations:** Which doctor to see for your condition.
• **Ayurvedic Remedies:** Natural herbs, dosages, and home care.
• **Platform Guidance:** Booking video consultations, viewing clinic maps, or ordering medicines.

*Please note: For medical emergencies, always call **108** or visit your nearest hospital.*`;
}

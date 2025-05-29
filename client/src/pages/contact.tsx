import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import SharedHeader from '@/components/layouts/shared-header';
import SharedFooter from '@/components/layouts/SharedFooter';
import { useBranding } from '@/components/branding/branding-provider';

export default function ContactPage() {
  const branding = useBranding();
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    website: '', // Honeypot field
    mathAnswer: ''
  });
  const [mathQuestion, setMathQuestion] = useState('');
  const [formTimestamp, setFormTimestamp] = useState<number>(0);
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  // Load math captcha when component mounts
  useEffect(() => {
    loadMathCaptcha();
  }, []);

  const loadMathCaptcha = async () => {
    try {
      const response = await fetch('/api/contact/captcha', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.question) {
        setMathQuestion(data.question);
        // Set form timestamp when captcha is loaded
        if (data.timestamp) {
          setFormTimestamp(data.timestamp);
        }
      }
    } catch (error) {
      console.error('Failed to load captcha:', error);
      setMathQuestion('What is 5 + 3?'); // Fallback question
      setFormTimestamp(Date.now());
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('submitting');
    setErrorMessage('');
    
    try {
      // Convert mathAnswer to number and add timestamp
      const submitData = {
        ...formState,
        mathAnswer: parseInt(formState.mathAnswer) || 0,
        formTimestamp: formTimestamp
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok) {
        setFormStatus('success');
        // Reset form
        setFormState({ 
          name: '', 
          email: '', 
          subject: '', 
          message: '', 
          website: '', 
          mathAnswer: '' 
        });
        // Load new captcha for next submission
        loadMathCaptcha();
        // After 5 seconds, reset the form status
        setTimeout(() => setFormStatus('idle'), 5000);
      } else {
        // Handle different error types
        console.error('Contact form error:', data);
        setFormStatus('error');
        
        // Set specific error messages based on error type
        switch (data.error) {
          case 'TOO_MANY_REQUESTS':
            setErrorMessage('Too many submissions. Please wait 15 minutes before trying again.');
            break;
          case 'CAPTCHA_FAILED':
            setErrorMessage('Math verification failed. Please check your answer and try again.');
            loadMathCaptcha(); // Load new captcha
            break;
          case 'VALIDATION_ERROR':
            setErrorMessage(data.message || 'Please check your input and try again.');
            break;
          case 'SUSPICIOUS_CONTENT':
            setErrorMessage('Your message contains content that cannot be processed. Please revise and try again.');
            break;
          case 'TOO_FAST':
            setErrorMessage('Please take your time filling out the form.');
            break;
          default:
            setErrorMessage(data.message || 'Something went wrong. Please try again.');
        }
        
        // After 5 seconds, reset the form status
        setTimeout(() => {
          setFormStatus('idle');
          setErrorMessage('');
        }, 5000);
      }
    } catch (error) {
      console.error('Network error:', error);
      setFormStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
      // After 5 seconds, reset the form status
      setTimeout(() => {
        setFormStatus('idle');
        setErrorMessage('');
      }, 5000);
    }
  };

  // Animation variants
  const containerAnimation = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemAnimation = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1.0]
      }
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <SharedHeader />

      {/* Hero Section */}
      <section className="relative pt-24 md:pt-32 bg-gradient-to-b from-indigo-950 via-indigo-900 to-purple-900 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-indigo-500/20 blur-3xl -left-64 -top-64"></div>
          <div className="absolute w-[500px] h-[500px] rounded-full bg-purple-500/20 blur-3xl -right-32 top-64"></div>
          <div className="absolute w-[700px] h-[700px] rounded-full bg-blue-500/20 blur-3xl left-1/2 -bottom-96"></div>
        </div>
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Get in <span className="text-indigo-400">Touch</span>
            </h1>
            <p className="text-lg text-indigo-200 mb-8 max-w-2xl mx-auto">
              Have questions about our services or need assistance? We're here to help. Reach out to our team and we'll get back to you as soon as possible.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <motion.div 
            variants={containerAnimation}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start"
          >
            {/* Contact Form */}
            <motion.div variants={itemAnimation} className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Send Us a Message</h2>
              
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Your Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formState.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="John Doe"
                      required
                      maxLength={100}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Your Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formState.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="john.doe@example.com"
                      required
                      maxLength={254}
                    />
                  </div>
                </div>

                {/* Honeypot field - hidden from users */}
                <input
                  type="text"
                  name="website"
                  value={formState.website}
                  onChange={handleChange}
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                />
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                  <select
                    id="subject"
                    name="subject"
                    value={formState.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                    required
                  >
                    <option value="" disabled>Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="billing">Billing Question</option>
                    <option value="partnership">Business Partnership</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">Your Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formState.message}
                    onChange={handleChange}
                    rows={5}
                    className="w-full px-4 py-3 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="How can we help you?"
                    required
                    minLength={10}
                    maxLength={5000}
                  ></textarea>
                  <div className="text-xs text-slate-500 mt-1">
                    {formState.message.length}/5000 characters (minimum 10)
                  </div>
                </div>

                {/* Math Captcha */}
                <div>
                  <label htmlFor="mathAnswer" className="block text-sm font-medium text-slate-700 mb-1">
                    Security Verification
                  </label>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-md p-3 mb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                        </svg>
                        <span className="text-indigo-800 font-medium">
                          {mathQuestion || 'Loading security question...'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={loadMathCaptcha}
                        className="text-indigo-600 hover:text-indigo-800 p-1 rounded transition-colors"
                        title="Refresh security question"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    id="mathAnswer"
                    name="mathAnswer"
                    value={formState.mathAnswer}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="Enter your answer"
                    required
                    min="0"
                    max="50"
                    disabled={!mathQuestion || mathQuestion === 'Loading security question...'}
                  />
                  <div className="text-xs text-slate-500 mt-1">
                    Please solve this simple math problem to verify you're human
                  </div>
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={formStatus === 'submitting'}
                    className={`w-full px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition-all duration-300 shadow-lg shadow-indigo-600/30 flex items-center justify-center ${formStatus === 'submitting' ? 'opacity-80 cursor-not-allowed' : ''}`}
                  >
                    {formStatus === 'submitting' ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : 'Send Message'}
                  </button>
                  
                  {formStatus === 'success' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 bg-green-100 border border-green-300 text-green-800 rounded-md"
                    >
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        <div>
                          <p className="font-medium">Message sent successfully!</p>
                          <p className="text-sm">We'll get back to you within 24 hours. Check your email for a confirmation.</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  {formStatus === 'error' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 bg-red-100 border border-red-300 text-red-800 rounded-md"
                    >
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                        </svg>
                        <div>
                          <p className="font-medium">Unable to send message</p>
                          <p className="text-sm">
                            {errorMessage || 'Please try again later or contact us directly at support@atscribe.com'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </form>
            </motion.div>
            
            {/* Contact Information */}
            <div className="space-y-8">
              <motion.div 
                variants={itemAnimation}
                className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100"
              >
                <div className="flex items-start space-x-4">
                  <div className="bg-indigo-100 p-3 rounded-lg">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">Phone</h3>
                    <p className="text-slate-600">+1 (555) 123-4567</p>
                    <p className="text-slate-600">Monday-Friday, 9AM-6PM EST</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                variants={itemAnimation}
                className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100"
              >
                <div className="flex items-start space-x-4">
                  <div className="bg-indigo-100 p-3 rounded-lg">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">Email</h3>
                    <p className="text-slate-600">support@{branding.appName.toLowerCase()}.com</p>
                    <p className="text-slate-600">We aim to respond within 24 hours</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                variants={itemAnimation}
                className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100"
              >
                <div className="flex items-start space-x-4">
                  <div className="bg-indigo-100 p-3 rounded-lg">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">CORPORATE OFFICE</h3>
                    <p className="text-slate-700 font-medium">Futureaiit Consulting Pvt. Ltd.</p>
                    <p className="text-slate-600">UNIT 405411 BIZNESS SQR</p>
                    <p className="text-slate-600">Madhapur, Hyderabad, TG
                    500081, IN</p>
                    <p className="text-slate-500 text-sm mt-2 italic">{branding.appName} is a product of Futureaiit Consulting Pvt. Ltd.</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                variants={itemAnimation}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-6 text-white"
              >
                <h3 className="text-xl font-bold mb-4">Connect With Us</h3>
                <p className="mb-4">Follow us on social media for updates, tips, and more.</p>
                <div className="flex space-x-4">
                  <a href={`https://twitter.com/${branding.appName}`} className="bg-white/20 hover:bg-white/30 p-3 rounded-full transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                    </svg>
                  </a>
                  
                  <a href={`https://linkedin.com/company/${branding.appName}`} className="bg-white/20 hover:bg-white/30 p-3 rounded-full transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" clipRule="evenodd"></path>
                    </svg>
                  </a>
                  
                  <a href={`https://instagram.com/${branding.appName}`} className="bg-white/20 hover:bg-white/30 p-3 rounded-full transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
                    </svg>
                  </a>
                  
                  <a href={`https://facebook.com/${branding.appName}`} className="bg-white/20 hover:bg-white/30 p-3 rounded-full transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
                    </svg>
                  </a>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-slate-100">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Find answers to common questions about our services. If you don't see your question here, feel free to contact us directly.
            </p>
          </motion.div>
          
          <div className="max-w-3xl mx-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">What is {branding.appName}?</h3>
                <p className="text-slate-600">
                  {branding.appName} is an AI-powered platform designed to help students and early career professionals create ATS-optimized resumes, tailored cover letters, and track job applications—all in one secure place.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">How does the pricing work?</h3>
                <p className="text-slate-600">
                  We offer a range of affordable plans specifically designed for students and early career professionals. You can view our pricing options on our <a href="/pricing" className="text-indigo-600 hover:text-indigo-800">pricing page</a>.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Is my data secure?</h3>
                <p className="text-slate-600">
                  Yes, we take data security very seriously. All sensitive information is encrypted at rest and in transit, and we follow industry-standard security protocols to ensure your data remains private.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">How can I get technical support?</h3>
                <p className="text-slate-600">
                  For technical issues, you can contact our support team via the form on this page, or send an email directly to support@{branding.appName.toLowerCase()}.com. We typically respond within 24 hours.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <SharedFooter />
    </div>
  );
} 
import { motion } from 'framer-motion';

interface TestimonialProps {
  quote: string;
  name: string;
  position: string;
  company?: string;
  image?: string;
  delay?: number;
}

export default function Testimonial({
  quote,
  name,
  position,
  company,
  image,
  delay = 0
}: TestimonialProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="bg-slate-800 rounded-lg p-6 flex flex-col h-full"
    >
      <div className="mb-6 flex-1">
        <svg 
          className="w-8 h-8 text-indigo-500 mb-4" 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z"></path>
        </svg>
        <p className="italic text-gray-300">{quote}</p>
      </div>
      
      <div className="flex items-center">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-12 h-12 rounded-full mr-4 object-cover"
          />
        ) : (
          <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center mr-4">
            <span className="text-white font-medium text-lg">
              {name.charAt(0)}
            </span>
          </div>
        )}
        <div>
          <h4 className="font-medium text-white">{name}</h4>
          <p className="text-sm text-gray-400">
            {position}{company ? `, ${company}` : ''}
          </p>
        </div>
      </div>
    </motion.div>
  );
} 
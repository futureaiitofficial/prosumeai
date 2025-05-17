import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';

interface TestimonialProps {
  quote: string;
  name: string;
  title: string;
  avatarSrc?: string;
}

const Testimonial: React.FC<TestimonialProps> = ({ quote, name, title, avatarSrc }) => {
  const initials = name.split(' ').map(n => n[0]).join('');
  
  return (
    <Card className="bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 border border-indigo-100 hover:border-indigo-200">
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          <div>
            <svg className="h-6 w-6 text-indigo-600 mb-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
            <p className="text-gray-700 italic">{quote}</p>
          </div>
          <div className="flex items-center space-x-3 mt-4">
            <Avatar>
              {avatarSrc ? <AvatarImage src={avatarSrc} alt={name} /> : null}
              <AvatarFallback className="bg-indigo-100 text-indigo-800">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-indigo-900">{name}</p>
              <p className="text-sm text-gray-600">{title}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const PricingTestimonials: React.FC = () => {
  const testimonials = [
    {
      quote: "ATScribe helped me land interviews at 3 tech companies I've been dreaming of joining. The AI-powered suggestions were spot on!",
      name: "Sarah Johnson",
      title: "Software Engineer",
      avatarSrc: "/images/testimonials/sarah.jpg"
    },
    {
      quote: "As a recent graduate, I was struggling with my resume. ATScribe made it so easy to highlight my skills and stand out to employers.",
      name: "Michael Chen",
      title: "Business Graduate",
      avatarSrc: "/images/testimonials/michael.jpg"
    },
    {
      quote: "The ATS scanner feature saved me so much time and frustration. I finally understand what was holding my resume back!",
      name: "Priya Patel",
      title: "Marketing Specialist",
      avatarSrc: "/images/testimonials/priya.jpg"
    }
  ];

  return (
    <div className="py-16 bg-gradient-to-b from-white to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-4 text-indigo-900">What Our Users Say</h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Join thousands of students and professionals who have transformed their job search with ATScribe
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Testimonial
              key={index}
              quote={testimonial.quote}
              name={testimonial.name}
              title={testimonial.title}
              avatarSrc={testimonial.avatarSrc}
            />
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <a href="/register?planId=1" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium">
            Join them today
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

export default PricingTestimonials; 
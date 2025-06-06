import React from 'react';

interface FAQProps {
  appName: string;
}

const FAQ: React.FC<FAQProps> = ({ appName }) => {
  return (
    <div className="bg-indigo-50 py-12 md:py-16 lg:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-2 text-indigo-900">Frequently Asked Questions</h2>
        <p className="text-center text-gray-600 mb-10">Everything you need to know about our plans and pricing</p>
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold mb-2 text-indigo-900">Do I need a credit card to get started?</h3>
            <p className="text-gray-600">No! You can start with our Entry plan completely free, no credit card required. You only need to provide payment details when you're ready to upgrade to a paid plan.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold mb-2 text-indigo-900">What payment methods do you accept?</h3>
            <p className="text-gray-600">We accept all major credit cards, PayPal, and local payment methods depending on your region. Our payment process is secure and encrypted.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold mb-2 text-indigo-900">Can I cancel my subscription anytime?</h3>
            <p className="text-gray-600">Absolutely! You can cancel your subscription at any time with just a few clicks. You'll continue to have access to your plan until the end of your billing period, no questions asked.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold mb-2 text-indigo-900">Is there a refund policy?</h3>
            <p className="text-gray-600">Yes, we offer a 14-day money-back guarantee if you're not satisfied with our service. Simply contact our support team within 14 days of your purchase to request a refund.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold mb-2 text-indigo-900">How do I upgrade my plan?</h3>
            <p className="text-gray-600">Upgrading is simple! Just log in to your account, go to your subscription settings, and select the plan you want to upgrade to. The price difference will be prorated for the remainder of your billing cycle.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold mb-2 text-indigo-900">Do you offer discounts for students?</h3>
            <p className="text-gray-600">Yes! Our plans are already designed to be affordable for students, but we also offer special educational discounts. Contact our support team with your student ID for more information.</p>
          </div>
        </div>
        
        <div className="mt-10 text-center">
          <p className="text-gray-600 mb-4">Still have questions? We're here to help!</p>
          <a href={`mailto:support@${appName}.com`} className="text-indigo-600 hover:text-indigo-800 font-medium">
            Contact our support team →
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQ; 
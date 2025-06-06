import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
  const [, setLocation] = useLocation();
  
  // Scroll to top on load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Handle back navigation
  const handleBack = () => {
    // Force navigation to home page
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            className="mr-4" 
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Terms of Service</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <div className="prose max-w-none">
            <div className="mb-8 text-sm text-gray-500">
              <p>Last Updated: July 15, 2024</p>
              <p>Effective Date: July 15, 2024</p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">1. Agreement to Terms</h2>
              <p>
                By accessing or using ATScribe ("Service"), operated by Futureaiit Consulting Private Limited ("Company", "we", "us", or "our"), you agree to be bound by these Terms of Service ("Terms"). These Terms constitute a legally binding agreement between you and the Company. If you disagree with any part of these Terms, you may not access the Service.
              </p>
              <p className="mt-4">
                We reserve the right to modify these Terms at any time. We will provide notice of any material changes by posting the new Terms on this page and updating the "Last Updated" date. Your continued use of the Service after such modifications constitutes your acceptance of the modified Terms.
              </p>
              <p className="mt-4">
                These Terms include and incorporate by reference our Privacy Policy, which can be found at [Privacy Policy URL], as well as any other policies, guidelines, or documents referenced herein. By using the Service, you also acknowledge and agree to our Privacy Policy.
              </p>
              <p className="mt-4">
                Please read these Terms carefully. If you do not understand any part of these Terms or if you have any questions, please contact us using the information provided in Section 11 before using the Service. Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">2. Service Description and Eligibility</h2>
              <p>
                ATScribe provides AI-powered tools for professional document creation and job application management. The Service is designed to assist users in optimizing their professional documents and managing their job application process more effectively through the use of artificial intelligence and other technologies.
              </p>
              <p className="mt-4">
                <strong>2.1 Service Description</strong>
              </p>
              <p className="mt-4">
                The Service includes, but is not limited to, the following features and functionalities:
              </p>
              <p className="mt-4">
                <strong>AI-powered Resume and Cover Letter Creation:</strong> The Service offers tools for creating, editing, and optimizing professional resumes and cover letters with AI assistance. These tools analyze content, provide suggestions for improvements, and help format documents to professional standards.
              </p>
              <p className="mt-4">
                <strong>Job Application Tracking:</strong> The Service provides a system for tracking job applications, including application status, follow-up tasks, interview scheduling, and related communications. This system helps users organize their job search and manage their application pipeline effectively.
              </p>
              <p className="mt-4">
                <strong>Document Storage and Management:</strong> The Service offers secure cloud storage for professional documents, including resumes, cover letters, portfolios, and other job-related materials. Users can access, edit, and manage these documents from any compatible device with internet access.
              </p>
              <p className="mt-4">
                <strong>AI-powered Content Suggestions:</strong> The Service provides real-time suggestions for improving professional documents, including content enhancements, keyword optimization, grammar corrections, and formatting recommendations based on industry best practices and AI analysis.
              </p>
              <p className="mt-4">
                <strong>Integration with Job Boards and ATS Systems:</strong> The Service may offer integration with various job boards, applicant tracking systems (ATS), and other third-party services to facilitate job searches, applications, and document optimization specific to target employers or positions.
              </p>
              <p className="mt-4">
                <strong>2.2 Service Limitations</strong>
              </p>
              <p className="mt-4">
                While we strive to provide high-quality services, you acknowledge and agree to the following limitations:
              </p>
              <p className="mt-4">
                <strong>AI Limitations:</strong> The AI-powered features of the Service provide suggestions and recommendations based on algorithms and patterns recognized from training data. These suggestions are not guaranteed to be error-free, complete, or suitable for every specific situation. Users should exercise their own judgment when implementing AI suggestions.
              </p>
              <p className="mt-4">
                <strong>No Employment Guarantee:</strong> Use of the Service does not guarantee employment or job interview opportunities. The effectiveness of professional documents and job applications depends on many factors beyond our control, including job market conditions, employer preferences, and individual qualifications.
              </p>
              <p className="mt-4">
                <strong>Third-Party Integrations:</strong> The functionality of third-party integrations may change without notice due to modifications made by the third-party providers. We do not guarantee continuous compatibility with all third-party services.
              </p>
              <p className="mt-4">
                <strong>2.3 Eligibility</strong>
              </p>
              <p className="mt-4">
                To use the Service, you must meet the following eligibility requirements:
              </p>
              <p className="mt-4">
                <strong>Age Requirement:</strong> You must be at least 18 years of age or the age of legal majority in your jurisdiction, whichever is greater.
              </p>
              <p className="mt-4">
                <strong>Legal Capacity:</strong> You must have the legal capacity to enter into binding contracts under the laws of your jurisdiction.
              </p>
              <p className="mt-4">
                <strong>Not Legally Barred:</strong> You must not be prohibited from using the Service under the laws of your jurisdiction or any other applicable jurisdiction.
              </p>
              <p className="mt-4">
                <strong>Account in Good Standing:</strong> If you previously had an account with us, your account must not have been terminated for violation of our Terms or policies.
              </p>
              <p className="mt-4">
                By using the Service, you represent and warrant that you meet all eligibility requirements. We reserve the right to verify your eligibility at any time and to suspend or terminate your access to the Service if we determine, in our sole discretion, that you do not meet these requirements.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. Account Registration and Security</h2>
              <p>
                Access to certain features of the Service requires registration and creation of a user account. When you register for an account, you agree to provide accurate and complete information and to keep this information updated. Your account registration and use of the Service are subject to the following terms and conditions.
              </p>
              <p className="mt-4">
                <strong>3.1 Registration Requirements</strong>
              </p>
              <p className="mt-4">
                When registering for an account with the Service, you agree to the following requirements and obligations:
              </p>
              <p className="mt-4">
                <strong>Accurate Information:</strong> You must provide accurate, current, and complete information during the registration process and keep your information updated. This includes, but is not limited to, your name, email address, and any other information requested during registration. Providing false or misleading information may result in immediate termination of your account.
              </p>
              <p className="mt-4">
                <strong>Unique Account:</strong> You may create only one account unless explicitly permitted otherwise. Accounts are personal and may not be shared with other individuals. You may not create multiple accounts to circumvent restrictions or limitations on the Service.
              </p>
              <p className="mt-4">
                <strong>Valid Contact Information:</strong> You must provide a valid email address that you regularly access, as important account information and notices will be sent to this address. Failure to maintain a valid email address may result in missing critical updates or security notifications.
              </p>
              <p className="mt-4">
                <strong>Verification Processes:</strong> You may be required to verify your identity or contact information through email verification, phone verification, or other methods. You agree to complete these verification processes as requested.
              </p>
              <p className="mt-4">
                <strong>3.2 Account Security</strong>
              </p>
              <p className="mt-4">
                You are responsible for maintaining the security and confidentiality of your account credentials. While we implement reasonable security measures to protect your account, your vigilance and security practices are essential. You agree to the following security responsibilities:
              </p>
              <p className="mt-4">
                <strong>Password Security:</strong> You must create and use strong, unique passwords that comply with our password requirements. Strong passwords typically include a combination of uppercase and lowercase letters, numbers, and special characters. You should not use the same password for multiple services or websites.
              </p>
              <p className="mt-4">
                <strong>Multi-Factor Authentication:</strong> When available, we strongly recommend enabling two-factor or multi-factor authentication for added security. This provides an additional layer of protection for your account beyond just your password.
              </p>
              <p className="mt-4">
                <strong>Credential Confidentiality:</strong> You must keep your account credentials, including your password and any authentication codes, strictly confidential. You should not share your credentials with any third party, including friends, family members, or colleagues.
              </p>
              <p className="mt-4">
                <strong>Session Management:</strong> You should log out of your account after each session, especially when using shared or public computers or devices. You are responsible for any activity that occurs while your account is logged in.
              </p>
              <p className="mt-4">
                <strong>Regular Monitoring:</strong> You should regularly review your account activity for any unauthorized access or suspicious transactions. If you detect any unauthorized use or security breach, you must notify us immediately.
              </p>
              <p className="mt-4">
                <strong>3.3 Unauthorized Access</strong>
              </p>
              <p className="mt-4">
                You agree to take full responsibility for all activities that occur under your account. If you become aware of any unauthorized access to your account or any other security breach, you must:
              </p>
              <p className="mt-4">
                <strong>Immediate Notification:</strong> Notify us immediately through our designated support channels.
              </p>
              <p className="mt-4">
                <strong>Password Reset:</strong> Change your password immediately if you suspect it has been compromised.
              </p>
              <p className="mt-4">
                <strong>Cooperation:</strong> Cooperate with our investigation and provide any information requested to help resolve the security incident.
              </p>
              <p className="mt-4">
                We reserve the right to suspend or terminate your account if we suspect unauthorized access or if your account is being used in a manner that violates these Terms or poses a security risk to our Service or other users.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">4. Intellectual Property Rights</h2>
              <p>
                Intellectual property rights are an important aspect of our Service. This section outlines the ownership and usage rights for content on the Service, including both Company-owned content and user-generated content.
              </p>
              <p className="mt-4">
                <strong>4.1 Company Intellectual Property</strong>
              </p>
              <p className="mt-4">
                All aspects of the Service that are created, maintained, or owned by the Company are protected by intellectual property laws. This includes, but is not limited to:
              </p>
              <p className="mt-4">
                <strong>Service Content:</strong> All content, features, and functionality of the Service, including but not limited to text, graphics, logos, icons, images, audio clips, digital downloads, data compilations, and software, are the exclusive property of the Company, its licensors, or other content providers and are protected by copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
              </p>
              <p className="mt-4">
                <strong>Service Design:</strong> The design, structure, selection, coordination, expression, look and feel, and arrangement of the Service content are proprietary to the Company and are protected by copyright, trademark, and other intellectual property laws.
              </p>
              <p className="mt-4">
                <strong>Software:</strong> Any software provided as part of the Service is the property of the Company or its software suppliers and is protected by copyright and other intellectual property laws. Use of the software is governed by the terms of the end user license agreement, if any, which accompanies or is included with the software.
              </p>
              <p className="mt-4">
                <strong>AI Models and Algorithms:</strong> The AI models, algorithms, machine learning systems, and related technologies that power the Service are proprietary to the Company and protected by intellectual property laws. Nothing in these Terms grants you any rights to these underlying technologies.
              </p>
              <p className="mt-4">
                <strong>4.2 User Content</strong>
              </p>
              <p className="mt-4">
                "User Content" refers to any content that you create, upload, submit, or otherwise make available to the Service, including but not limited to resumes, cover letters, portfolios, personal information, job application data, and any other materials or information.
              </p>
              <p className="mt-4">
                <strong>Ownership of User Content:</strong> You retain ownership of all intellectual property rights in your User Content. Nothing in these Terms transfers ownership of your User Content to the Company.
              </p>
              <p className="mt-4">
                <strong>License to User Content:</strong> By submitting User Content to the Service, you grant the Company a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to use, reproduce, distribute, prepare derivative works of, display, and perform your User Content in connection with the Service and the Company's business operations, including but not limited to:
              </p>
              <p className="mt-4">
                <strong>Service Provision:</strong> Using your User Content to provide, maintain, and improve the Service, including generating AI-based suggestions and optimizations.
              </p>
              <p className="mt-4">
                <strong>AI Training:</strong> Using anonymized and aggregated data derived from your User Content to train, improve, and develop our AI models and algorithms, which power various features of the Service.
              </p>
              <p className="mt-4">
                <strong>Research and Development:</strong> Analyzing patterns and trends in User Content (in anonymized form) to develop new features, products, or services.
              </p>
              <p className="mt-4">
                <strong>Marketing:</strong> With your explicit consent, using your success stories or testimonials for marketing and promotional purposes.
              </p>
              <p className="mt-4">
                This license continues even if you stop using the Service, solely with respect to aggregated, anonymized, or de-identified data that does not personally identify you.
              </p>
              <p className="mt-4">
                <strong>User Content Representations:</strong> You represent and warrant that:
              </p>
              <p className="mt-4">
                <strong>Ownership:</strong> You own or control all rights to your User Content or have received all necessary permissions from the rightful owners.
              </p>
              <p className="mt-4">
                <strong>Non-Infringement:</strong> Your User Content does not infringe upon the intellectual property rights or other rights of any third party.
              </p>
              <p className="mt-4">
                <strong>Accuracy:</strong> Your User Content is accurate and not misleading or fraudulent.
              </p>
              <p className="mt-4">
                <strong>Compliance:</strong> Your User Content complies with these Terms and all applicable laws and regulations.
              </p>
              <p className="mt-4">
                <strong>4.3 Trademarks</strong>
              </p>
              <p className="mt-4">
                "ATScribe" and related logos, product and service names, designs, and slogans are registered or unregistered trademarks of Futureaiit Consulting Private Limited. You may not use these marks without our prior written permission. All other names, logos, product and service names, designs, and slogans appearing on the Service are the trademarks of their respective owners and may not be used without permission.
              </p>
              <p className="mt-4">
                Nothing in these Terms grants you any right or license to use any of our trademarks, logos, or other brand elements. Any goodwill generated from the use of our trademarks will inure exclusively to our benefit.
              </p>
              <p className="mt-4">
                <strong>4.4 Copyright Infringement</strong>
              </p>
              <p className="mt-4">
                We respect the intellectual property rights of others and expect users of our Service to do the same. We will respond to notices of alleged copyright infringement that comply with applicable law. If you believe that your copyrighted work has been copied in a way that constitutes copyright infringement, please provide our copyright agent with the following information:
              </p>
              <p className="mt-4">
                <strong>Identification:</strong> A description of the copyrighted work that you claim has been infringed.
              </p>
              <p className="mt-4">
                <strong>Location:</strong> A description of where the material that you claim is infringing is located on the Service, with enough detail that we can find it.
              </p>
              <p className="mt-4">
                <strong>Contact Information:</strong> Your contact information, including your address, telephone number, and email address.
              </p>
              <p className="mt-4">
                <strong>Statement:</strong> A statement by you that you have a good faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law.
              </p>
              <p className="mt-4">
                <strong>Declaration:</strong> A statement by you, made under penalty of perjury, that the information in your notice is accurate and that you are the copyright owner or authorized to act on the copyright owner's behalf.
              </p>
              <p className="mt-4">
                Notices of copyright infringement should be sent to our designated copyright agent at legal@futureaiit.com.
              </p>
              <p className="mt-4">
                We reserve the right to remove content alleged to be infringing and to terminate accounts of repeat infringers in appropriate circumstances and at our sole discretion.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">5. Subscription and Payment Terms</h2>
              <p>
                ATScribe offers various subscription plans that provide access to different features and service levels. This section outlines the terms and conditions related to subscriptions, payments, billing, refunds, and cancellations.
              </p>
              <p className="mt-4">
                <strong>5.1 Payment Processing and Financial Terms</strong>
              </p>
              <p className="mt-4">
                ATScribe utilizes PayPal and Razorpay as its authorized payment processors for all subscription transactions. When you subscribe to our services, you enter into a separate agreement with these payment processors regarding the processing of your payment information. By subscribing to our services, you expressly acknowledge and agree to the following terms:
              </p>
              <p className="mt-4">
                <strong>Payment Authorization:</strong> You authorize ATScribe and its designated payment processors to charge your chosen payment method (such as credit card, debit card, or other approved payment method) for all subscription fees and any applicable taxes. This authorization remains in effect until you cancel your subscription or we terminate these terms. For recurring subscriptions, you authorize recurring payments, and the payments will be made automatically until you cancel.
              </p>
              <p className="mt-4">
                <strong>Payment Processors:</strong> Your payment information is processed and stored by our payment processors, PayPal and Razorpay, according to their respective terms of service and privacy policies. We do not store complete payment card information on our servers. By providing your payment information, you authorize us to share necessary information with these payment processors to facilitate your transactions.
              </p>
              <p className="mt-4">
                <strong>Currency and Exchange Rates:</strong> All transactions are processed in your local currency where available. For transactions processed in a different currency, the exchange rate will be determined by the payment processor at the time of the transaction. You acknowledge that exchange rates may fluctuate and that the final amount charged may vary slightly from the displayed price due to these fluctuations or due to differences in currency exchange rates between the time we display the price to you and the time your payment processor processes the transaction.
              </p>
              <p className="mt-4">
                <strong>Tax Compliance:</strong> You are responsible for all applicable taxes, including but not limited to sales tax, value-added tax (VAT), goods and services tax (GST), or any other tax or duty that may be levied in connection with your subscription. Tax rates and applicability are determined based on the billing address you provide and the tax laws of the relevant jurisdictions. We may collect and remit taxes where required by law. The displayed prices may or may not include applicable taxes, depending on the jurisdiction and tax regulations. We reserve the right to modify our tax collection practices in response to changes in tax laws or regulations.
              </p>
              <p className="mt-4">
                <strong>Payment Information:</strong> You agree to provide accurate, current, and complete payment information at the time of subscription. You must promptly update your payment information if any changes occur, including but not limited to card expiration, change of billing address, or change in payment method. You understand that failure to maintain accurate payment information may result in interruption or termination of your service. We reserve the right to suspend or terminate your subscription if we are unable to process your payment due to expired or invalid payment methods, insufficient funds, or other reasons.
              </p>
              <p className="mt-4">
                <strong>Billing Errors:</strong> If you believe that we have billed you incorrectly, you must notify us within 30 days of the billing date. After this period, you waive your right to dispute such charges, except where prohibited by applicable law. We will make reasonable efforts to investigate and resolve billing disputes in good faith and in a timely manner.
              </p>
              <p className="mt-4">
                <strong>5.2 Subscription Terms and Modifications</strong>
              </p>
              <p className="mt-4">
                Your subscription to ATScribe is subject to the following terms and conditions:
              </p>
              <p className="mt-4">
                <strong>Subscription Tiers:</strong> ATScribe offers various subscription tiers, each with its own set of features, limitations, and pricing. The specific features, limitations, and pricing of each tier are described on our pricing page and may vary by region. We reserve the right to modify the features, limitations, and pricing of our subscription tiers at our discretion. Any material changes to your current subscription tier will be communicated to you at least thirty (30) days before they take effect.
              </p>
              <p className="mt-4">
                <strong>Subscription Period:</strong> Subscriptions are billed on a recurring basis according to the billing cycle you select (monthly, annually, or as otherwise specified at the time of purchase). Your subscription will automatically renew at the end of each billing period unless you cancel it before the renewal date. For annual subscriptions, we may send you a reminder notice before renewal, but we are not obligated to do so. You are responsible for ensuring timely cancellation if you do not wish to renew.
              </p>
              <p className="mt-4">
                <strong>Free Trials and Promotional Offers:</strong> We may offer free trials or promotional subscriptions from time to time. These offers may have additional terms and conditions, which will be disclosed at the time they are offered. Unless otherwise specified, free trials automatically convert to paid subscriptions at the end of the trial period unless cancelled before the trial period ends. You may be required to provide payment information to sign up for a free trial, but you will not be charged until the trial period ends.
              </p>
              <p className="mt-4">
                <strong>Price Changes:</strong> We reserve the right to modify our subscription prices at any time. For existing subscribers, any price changes will be communicated to you at least thirty (30) days in advance. Your continued use of the service after the price change becomes effective constitutes your acceptance of the new price. If you do not agree with a price change, you may cancel your subscription before the price change takes effect.
              </p>
              <p className="mt-4">
                <strong>Promotional Pricing:</strong> If you subscribe under a promotional or discounted rate, the discount may apply only for a limited time, after which the standard rate for your subscription tier will apply. The specific terms of promotional pricing will be disclosed at the time of subscription or as otherwise communicated to you.
              </p>
              <p className="mt-4">
                <strong>Service Modifications:</strong> We are constantly evolving and improving the Service. We reserve the right to add, alter, or remove functionality from our Service at any time without prior notice, except when such changes would materially reduce the core functionality of your subscription tier. In such cases, we will provide at least thirty (30) days' notice.
              </p>
              <p className="mt-4">
                <strong>5.3 Refund and Cancellation Policy</strong>
              </p>
              <p className="mt-4">
                The following terms govern refunds and cancellations of your ATScribe subscription:
              </p>
              <p className="mt-4">
                <strong>General Refund Policy:</strong> All subscription fees are non-refundable except as explicitly stated in these terms or as required by applicable law. This policy is designed to protect our business model and ensure fair usage of our services. We do not provide prorated refunds for partial use of the Service during a billing period.
              </p>
              <p className="mt-4">
                <strong>Refund Exceptions:</strong> Refunds may be granted in the following circumstances, at our sole discretion:
              </p>
              <p className="mt-4">
                <strong>Technical Failures:</strong> If the service is unavailable for more than 72 consecutive hours due to technical issues on our end, you may be eligible for a prorated refund for the affected period or an extension of your subscription period.
              </p>
              <p className="mt-4">
                <strong>Billing Errors:</strong> In cases of duplicate charges, incorrect amounts, or other billing errors that are demonstrably our fault or the fault of our payment processors.
              </p>
              <p className="mt-4">
                <strong>Legal Requirements:</strong> Where required by applicable consumer protection laws or regulations in your jurisdiction.
              </p>
              <p className="mt-4">
                <strong>Service Unavailability:</strong> Extended periods of service unavailability not caused by scheduled maintenance, force majeure events, or third-party service outages beyond our control.
              </p>
              <p className="mt-4">
                <strong>Payment Processing Issues:</strong> Failed transactions or processing errors by our payment processors that result in duplicate charges or other improper charges.
              </p>
              <p className="mt-4">
                <strong>Cancellation Process:</strong> You may cancel your subscription at any time through any of the following methods:
              </p>
              <p className="mt-4">
                <strong>Account Dashboard:</strong> By accessing the subscription management section in your account dashboard.
              </p>
              <p className="mt-4">
                <strong>Payment Processor Portal:</strong> By managing your recurring payments through your PayPal or Razorpay account.
              </p>
              <p className="mt-4">
                <strong>Customer Support:</strong> By contacting our customer support team at support@futureaiit.com with your cancellation request.
              </p>
              <p className="mt-4">
                Cancellation will take effect at the end of your current billing period. No refunds will be provided for partial subscription periods, and you will continue to have access to the Service until the end of your current billing period. Upon cancellation, your account may be converted to a limited free account if such an option is available, or it may be scheduled for deactivation.
              </p>
              <p className="mt-4">
                <strong>5.4 Subscription Management and Support</strong>
              </p>
              <p className="mt-4">
                The following terms govern the management of your subscription:
              </p>
              <p className="mt-4">
                <strong>Account Management:</strong> You are responsible for managing your subscription through the channels provided by us. These channels include:
              </p>
              <p className="mt-4">
                <strong>ATScribe Account Dashboard:</strong> The primary interface for subscription management, where you can view your current plan, billing history, update payment methods, change subscription tiers, and manage other subscription-related settings.
              </p>
              <p className="mt-4">
                <strong>Payment Processor Portals:</strong> PayPal and Razorpay customer portals provide additional options for managing your payment methods, viewing transaction history, and controlling recurring payments.
              </p>
              <p className="mt-4">
                <strong>Support Channels:</strong> Our customer support team is available to assist with subscription-related issues, billing questions, and account management through email, chat, or other designated support channels.
              </p>
              <p className="mt-4">
                <strong>Support Services:</strong> We provide support for subscription-related issues during our standard business hours, which are displayed on our support page. Response times may vary based on the nature of the issue, the support channel used, and current support volume. Premium subscribers may receive priority support as specified in their subscription tier.
              </p>
              <p className="mt-4">
                <strong>Subscription Changes:</strong> You may upgrade or downgrade your subscription at any time, subject to the following terms:
              </p>
              <p className="mt-4">
                <strong>Upgrades:</strong> When upgrading to a higher-tier subscription, the change will typically take effect immediately. You will be charged a prorated amount for the remainder of your current billing period based on the price difference between your current and new subscription tiers.
              </p>
              <p className="mt-4">
                <strong>Downgrades:</strong> When downgrading to a lower-tier subscription, the change will take effect at the end of your current billing period. You will continue to have access to your current subscription tier until that time.
              </p>
              <p className="mt-4">
                <strong>Billing Cycle Changes:</strong> Changes to your billing cycle (e.g., from monthly to annual) may require cancellation of your current subscription and creation of a new subscription with the desired billing cycle.
              </p>
              <p className="mt-4">
                <strong>5.5 Financial Disputes and Chargebacks</strong>
              </p>
              <p className="mt-4">
                The following terms govern financial disputes and chargebacks:
              </p>
              <p className="mt-4">
                <strong>Dispute Resolution:</strong> If you believe you have been charged incorrectly or have other billing concerns, you must contact our support team within thirty (30) days of the charge. We will investigate the matter and respond within a reasonable timeframe, typically within 5-7 business days. We request that you attempt to resolve any billing issues directly with us before initiating a chargeback or payment dispute with your payment processor or financial institution.
              </p>
              <p className="mt-4">
                <strong>Chargeback Policy:</strong> Chargebacks made without first attempting to resolve the issue with us are considered unauthorized and may result in:
              </p>
              <p className="mt-4">
                <strong>Immediate suspension or termination of your account</strong>
              </p>
              <p className="mt-4">
                <strong>Blocking of access to previously created content or documents</strong>
              </p>
              <p className="mt-4">
                <strong>Potential legal action to recover funds and associated fees</strong>
              </p>
              <p className="mt-4">
                <strong>Permanent ban from future use of our services</strong>
              </p>
              <p className="mt-4">
                We reserve the right to dispute chargebacks that we believe are invalid or without merit. If a chargeback is reversed, we may reinstate your account, subject to additional verification requirements or security deposits.
              </p>
              <p className="mt-4">
                <strong>Payment Verification:</strong> To prevent fraud and ensure the security of transactions, we may require additional verification for certain transactions. This may include identity verification, address verification, payment method verification, or other security measures. Failure to complete required verification may result in transaction rejection or account limitations.
              </p>
              <p className="mt-4">
                <strong>Fraud Prevention:</strong> We employ various fraud detection and prevention measures to protect our users and our business. These measures may include transaction monitoring, risk assessment, and security protocols. If we detect potentially fraudulent activity, we may:
              </p>
              <p className="mt-4">
                <strong>Request additional verification</strong>
              </p>
              <p className="mt-4">
                <strong>Temporarily limit account functionality</strong>
              </p>
              <p className="mt-4">
                <strong>Reject or reverse transactions</strong>
              </p>
              <p className="mt-4">
                <strong>Suspend or terminate accounts</strong>
              </p>
              <p className="mt-4">
                We make these decisions based on various risk factors and in accordance with our fraud prevention policies and applicable laws.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">6. User Conduct and Content Guidelines</h2>
              <p>
                To maintain a safe, professional, and productive environment for all users, we have established guidelines for conduct and content on our Service. Compliance with these guidelines is essential for the proper functioning of the Service and protection of all users.
              </p>
              <p className="mt-4">
                <strong>6.1 Prohibited Activities</strong>
              </p>
              <p className="mt-4">
                You agree not to engage in any of the following prohibited activities when using the Service:
              </p>
              <p className="mt-4">
                <strong>Legal Compliance:</strong> Violating any applicable local, state, national, or international law, regulation, or court order, including export control laws, intellectual property laws, anti-discrimination laws, or regulations concerning online conduct and acceptable content.
              </p>
              <p className="mt-4">
                <strong>Intellectual Property:</strong> Infringing upon or violating the intellectual property rights or other rights of any third party, including copyright, trademark, patent, trade secret, publicity, or privacy rights. This includes uploading, sharing, or distributing content that you do not have the rights to use.
              </p>
              <p className="mt-4">
                <strong>Security and System Integrity:</strong> Engaging in any activity that could harm, disrupt, compromise, or impair the integrity, security, or proper functioning of the Service, including:
              </p>
              <p className="mt-4">
                <strong>Malicious Code:</strong> Uploading or transmitting viruses, malware, spyware, adware, Trojan horses, or any other harmful code or content.
              </p>
              <p className="mt-4">
                <strong>Unauthorized Access:</strong> Attempting to gain unauthorized access to the Service, other users' accounts, or systems connected to the Service through hacking, password mining, or any other means.
              </p>
              <p className="mt-4">
                <strong>Service Disruption:</strong> Interfering with or disrupting the Service, servers, or networks connected to the Service, including by overloading, flooding, spamming, mail-bombing, or crashing the Service.
              </p>
              <p className="mt-4">
                <strong>Data Collection:</strong> Engaging in any form of automated data collection, data mining, data extraction, or data scraping from the Service without our express written consent. This includes using bots, crawlers, or similar technologies to access or use the Service.
              </p>
              <p className="mt-4">
                <strong>Account Security:</strong> Sharing your account credentials or allowing unauthorized third parties to access your account. Each account is for individual use only, and you are responsible for maintaining the confidentiality of your credentials.
              </p>
              <p className="mt-4">
                <strong>Misuse of Service:</strong> Using the Service for any illegal, harmful, fraudulent, infringing, or objectionable purpose, or to promote or facilitate illegal activities.
              </p>
              <p className="mt-4">
                <strong>Circumvention:</strong> Bypassing, removing, deactivating, or otherwise circumventing any technological protection measures or security features that protect the Service or its content.
              </p>
              <p className="mt-4">
                <strong>Reverse Engineering:</strong> Decompiling, disassembling, reverse engineering, or attempting to derive the source code of any part of the Service, except where such restrictions are prohibited by applicable law.
              </p>
              <p className="mt-4">
                <strong>False Information:</strong> Providing false, inaccurate, or misleading information in your account profile, professional documents, or communications through the Service.
              </p>
              <p className="mt-4">
                <strong>6.2 Content Standards</strong>
              </p>
              <p className="mt-4">
                All content that you upload, create, or share through the Service ("User Content") must comply with the following standards:
              </p>
              <p className="mt-4">
                <strong>Accuracy and Truthfulness:</strong> User Content must be truthful, accurate, and not misleading. While the Service may assist with optimizing professional documents, the underlying qualifications, experiences, and other claims in your content must be genuine and verifiable.
              </p>
              <p className="mt-4">
                <strong>Non-Infringing:</strong> User Content must not infringe upon any intellectual property rights, privacy rights, publicity rights, or other proprietary rights of any party. This includes using logos, trademarks, or copyrighted materials without proper authorization.
              </p>
              <p className="mt-4">
                <strong>Security:</strong> User Content must not contain malicious code, viruses, spyware, or other harmful software that could damage or compromise the Service, our systems, or other users' devices or data.
              </p>
              <p className="mt-4">
                <strong>Non-Discriminatory and Non-Harassing:</strong> User Content must not be discriminatory, harassing, hateful, or promote violence against individuals or groups based on race, ethnicity, national origin, religion, sex, gender, gender identity, sexual orientation, disability, age, or any other characteristic protected by law.
              </p>
              <p className="mt-4">
                <strong>Sensitive Information:</strong> User Content must not include sensitive personal or financial information that could pose security or privacy risks if compromised. This includes social security numbers, financial account numbers, health information, or other sensitive data not necessary for the intended purpose of the Service.
              </p>
              <p className="mt-4">
                <strong>Legal Compliance:</strong> User Content must not promote, encourage, or facilitate illegal activities, including but not limited to fraud, financial scams, identity theft, or violation of trade sanctions.
              </p>
              <p className="mt-4">
                <strong>No Impersonation:</strong> User Content must not impersonate or misrepresent your identity, qualifications, or affiliation with any person or organization. This includes creating false profiles or credentials.
              </p>
              <p className="mt-4">
                <strong>No Interference:</strong> User Content must not be designed to manipulate or interfere with the proper operation of the Service, including any attempt to manipulate algorithms, search results, or rankings within the Service.
              </p>
              <p className="mt-4">
                <strong>Professional Context:</strong> User Content should be appropriate for a professional context and relevant to the purpose of the Service, which is to support career development and job application processes.
              </p>
              <p className="mt-4">
                <strong>6.3 Content Monitoring and Enforcement</strong>
              </p>
              <p className="mt-4">
                We reserve the right, but do not assume the obligation, to monitor User Content for compliance with these Terms. We may take any of the following actions in response to User Content that violates these Terms:
              </p>
              <p className="mt-4">
                <strong>Content Removal:</strong> We may remove or refuse to display User Content that violates these Terms or that we find objectionable for any reason, in our sole discretion.
              </p>
              <p className="mt-4">
                <strong>Account Suspension:</strong> We may suspend or terminate access to the Service for users who repeatedly violate these Terms or whose User Content poses serious legal or security risks.
              </p>
              <p className="mt-4">
                <strong>Legal Action:</strong> We may take legal action against users who violate these Terms, including pursuing civil remedies or referring matters to law enforcement authorities when appropriate.
              </p>
              <p className="mt-4">
                <strong>Disclosure:</strong> We may disclose User Content and user information to respond to legal process, enforce these Terms, address fraud or security concerns, or protect the rights, property, or safety of the Company, its users, or the public.
              </p>
              <p className="mt-4">
                We encourage users to report content that violates these Terms by contacting us at support@futureaiit.com.
              </p>
              
              <p className="mt-4">
                <strong>6.4 User Responsibility for Content Accuracy and Job Applications</strong>
              </p>
              <p className="mt-4">
                You acknowledge and agree that you are solely responsible for the accuracy, completeness, and truthfulness of all information contained in your resumes, cover letters, portfolios, and any other professional documents created through or stored on the Service ("Professional Documents"). The following terms apply specifically to your Professional Documents and job applications:
              </p>
              <p className="mt-4">
                <strong>Truthfulness and Accuracy:</strong> All information you include in your Professional Documents must be accurate, truthful, and verifiable. You represent and warrant that all qualifications, work experience, education, skills, certifications, achievements, and other claims made in your Professional Documents are genuine and can be substantiated with appropriate documentation or references.
              </p>
              <p className="mt-4">
                <strong>No Company Verification:</strong> The Company does not verify, validate, or confirm the accuracy of any information contained in your Professional Documents. While our AI may provide suggestions for optimization, formatting, or content enhancement, we do not review, fact-check, or validate the underlying claims, qualifications, or experiences you include in your documents.
              </p>
              <p className="mt-4">
                <strong>Job Application Responsibility:</strong> When you submit job applications using Professional Documents created through our Service, you are making representations to potential employers about your qualifications and background. You acknowledge that:
              </p>
              <p className="mt-4">
                <strong>Personal Declaration:</strong> By submitting any job application, you are personally declaring that all information furnished is true, complete, and accurate to the best of your knowledge.
              </p>
              <p className="mt-4">
                <strong>Legal Consequences:</strong> Providing false, misleading, or inaccurate information in job applications may have serious legal and professional consequences, including but not limited to termination of employment, legal action by employers, damage to professional reputation, and potential criminal charges for fraud in certain jurisdictions.
              </p>
              <p className="mt-4">
                <strong>Employer Verification:</strong> Employers may conduct background checks, reference verification, and other due diligence procedures to verify the information in your application. You are responsible for ensuring that all information can withstand such scrutiny.
              </p>
              <p className="mt-4">
                <strong>Company Disclaimer:</strong> The Company explicitly disclaims any responsibility or liability for:
              </p>
              <p className="mt-4">
                <strong>False Information:</strong> Any false, misleading, or inaccurate information contained in your Professional Documents, regardless of whether such information was included by you directly or incorporated through AI suggestions that you accepted.
              </p>
              <p className="mt-4">
                <strong>Employment Consequences:</strong> Any consequences arising from the use of your Professional Documents in job applications, including but not limited to rejection of applications, termination of employment, legal action by employers, or damage to your professional reputation.
              </p>
              <p className="mt-4">
                <strong>Third-Party Actions:</strong> Any claims, demands, or legal action brought against you by employers, recruitment agencies, or other third parties based on information contained in your Professional Documents.
              </p>
              <p className="mt-4">
                <strong>Regulatory Compliance:</strong> Any violations of employment laws, professional regulations, or industry standards that may result from inaccurate information in your Professional Documents.
              </p>
              <p className="mt-4">
                <strong>AI Suggestions Disclaimer:</strong> While our AI provides content suggestions and optimizations, you acknowledge that:
              </p>
              <p className="mt-4">
                <strong>User Control:</strong> You have complete control over what information to include, modify, or remove from your Professional Documents.
              </p>
              <p className="mt-4">
                <strong>Final Responsibility:</strong> You are ultimately responsible for reviewing, verifying, and approving all content before using it in job applications.
              </p>
              <p className="mt-4">
                <strong>No Endorsement:</strong> AI suggestions do not constitute an endorsement or verification of the accuracy of any information by the Company.
              </p>
              <p className="mt-4">
                <strong>Indemnification:</strong> You agree to indemnify, defend, and hold harmless the Company, its officers, directors, employees, agents, and affiliates from and against any and all claims, damages, obligations, losses, liabilities, costs, and expenses (including attorney's fees) arising from or related to:
              </p>
              <p className="mt-4">
                <strong>Content Inaccuracy:</strong> Any inaccurate, false, or misleading information contained in your Professional Documents.
              </p>
              <p className="mt-4">
                <strong>Application Consequences:</strong> Any consequences arising from your use of Professional Documents in job applications or employment-related activities.
              </p>
              <p className="mt-4">
                <strong>Third-Party Claims:</strong> Any third-party claims or legal action related to information contained in your Professional Documents.
              </p>
              <p className="mt-4">
                <strong>Best Practices Recommendation:</strong> We strongly recommend that you:
              </p>
              <p className="mt-4">
                <strong>Regular Review:</strong> Regularly review and update your Professional Documents to ensure accuracy and currency.
              </p>
              <p className="mt-4">
                <strong>Documentation:</strong> Maintain supporting documentation for all claims made in your Professional Documents.
              </p>
              <p className="mt-4">
                <strong>Professional Advice:</strong> Consult with career counselors, legal advisors, or other professionals if you have questions about what information to include in your Professional Documents.
              </p>
              <p className="mt-4">
                <strong>Verification:</strong> Verify that all information is current and accurate before submitting any job application.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">7. Limitation of Liability and Disclaimer</h2>
              <p>
                This section outlines important limitations on our liability and disclaimers regarding the Service. Please read this section carefully as it affects your legal rights.
              </p>
              <p className="mt-4">
                <strong>7.1 Service Availability and Performance</strong>
              </p>
              <p className="mt-4">
                The Service is provided on an "as is" and "as available" basis, without warranties of any kind, either express or implied. We strive to maintain high availability and performance of the Service, but we cannot and do not guarantee uninterrupted or error-free operation.
              </p>
              <p className="mt-4">
                <strong>Scheduled Maintenance:</strong> We conduct regular maintenance to improve and update the Service. During scheduled maintenance periods, some or all features of the Service may be temporarily unavailable. We will make reasonable efforts to provide advance notice of scheduled maintenance through email, in-app notifications, or on our status page.
              </p>
              <p className="mt-4">
                <strong>Unscheduled Outages:</strong> Despite our best efforts, the Service may experience unscheduled outages due to technical issues, third-party service failures, security incidents, natural disasters, or other factors beyond our control. We will make reasonable efforts to restore service as quickly as possible and to communicate the status of major outages through our designated communication channels.
              </p>
              <p className="mt-4">
                <strong>Service Modifications:</strong> We reserve the right to modify, suspend, or discontinue the Service, or any part thereof, temporarily or permanently, with or without notice, for maintenance, updates, security reasons, or other business purposes. We will not be liable to you or any third party for any modification, suspension, or discontinuation of the Service.
              </p>
              <p className="mt-4">
                <strong>Technical Requirements:</strong> Using the Service requires compatible devices, software, and internet access. The performance of the Service may be affected by these factors, and we are not responsible for issues arising from your equipment, software, or internet connection.
              </p>
              <p className="mt-4">
                <strong>7.2 AI Content and Feature Disclaimers</strong>
              </p>
              <p className="mt-4">
                ATScribe uses artificial intelligence (AI) to provide various features and functionalities. While we strive to provide high-quality AI-powered services, you acknowledge and agree to the following limitations:
              </p>
              <p className="mt-4">
                <strong>Content Accuracy:</strong> We do not guarantee the accuracy, completeness, reliability, or suitability of any content generated, optimized, or suggested by our AI features. AI-generated content may contain errors, omissions, or inaccuracies. You are responsible for reviewing, verifying, and editing any AI-generated content before using it for your specific purposes.
              </p>
              <p className="mt-4">
                <strong>ATS Compatibility:</strong> While our Service aims to optimize resumes for applicant tracking systems (ATS), we do not guarantee compatibility with all ATS platforms or algorithms. ATS systems vary widely in their design and functionality, and we cannot ensure that documents created or optimized through our Service will be successfully processed by any specific ATS.
              </p>
              <p className="mt-4">
                <strong>Job Application Success:</strong> Using our Service does not guarantee job application success, interviews, or employment offers. Job application outcomes depend on numerous factors beyond our control, including but not limited to job market conditions, employer preferences, competition for positions, and your qualifications and fit for specific roles.
              </p>
              <p className="mt-4">
                <strong>Contextual Understanding:</strong> Our AI may not fully understand specific industry contexts, niche terminology, or regional variations in language and professional practices. You should use your judgment to ensure that AI suggestions are appropriate for your specific professional context.
              </p>
              <p className="mt-4">
                <strong>AI Limitations:</strong> AI technology has inherent limitations, including potential biases in training data, inability to understand nuanced human contexts, and limitations in processing certain types of information. You acknowledge these limitations and agree to use the AI features with appropriate discretion.
              </p>
              <p className="mt-4">
                <strong>7.3 Disclaimer of Warranties</strong>
              </p>
              <p className="mt-4">
                To the maximum extent permitted by applicable law, we disclaim all warranties and conditions, express, implied, or statutory, including but not limited to:
              </p>
              <p className="mt-4">
                <strong>Implied Warranties:</strong> Any implied warranties or conditions of merchantability, fitness for a particular purpose, title, quiet enjoyment, or non-infringement.
              </p>
              <p className="mt-4">
                <strong>System Integration:</strong> Any warranties that the Service will operate with any other software, system, or data.
              </p>
              <p className="mt-4">
                <strong>Error-Free Operation:</strong> Any warranties that the Service will be error-free or that errors will be corrected.
              </p>
              <p className="mt-4">
                <strong>Virus-Free Operation:</strong> Any warranties that the Service will be free from viruses or other harmful components.
              </p>
              <p className="mt-4">
                <strong>Security:</strong> Any warranties regarding the security, reliability, timeliness, or performance of the Service.
              </p>
              <p className="mt-4">
                <strong>Third-Party Services:</strong> Any warranties regarding the accuracy, reliability, or quality of any information, products, or services provided by or through third-party services integrated with our Service.
              </p>
              <p className="mt-4">
                <strong>7.4 Limitation of Liability</strong>
              </p>
              <p className="mt-4">
                To the maximum extent permitted by applicable law, in no event shall the Company, its directors, employees, agents, affiliates, or licensors be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:
              </p>
              <p className="mt-4">
                <strong>Loss of Profits:</strong> Loss of profits, revenue, or anticipated savings.
              </p>
              <p className="mt-4">
                <strong>Loss of Data:</strong> Loss of data or content, whether caused by negligence or otherwise, and whether or not we have been advised of the possibility of such damages.
              </p>
              <p className="mt-4">
                <strong>Business Interruption:</strong> Business interruption or loss of business opportunity.
              </p>
              <p className="mt-4">
                <strong>Employment-Related Losses:</strong> Failure to secure employment, interviews, or specific employment opportunities.
              </p>
              <p className="mt-4">
                <strong>Professional Reputation:</strong> Damage to professional reputation or career prospects.
              </p>
              <p className="mt-4">
                <strong>Capped Liability:</strong> In any case, our total liability to you for all damages shall not exceed the amount paid by you, if any, for accessing or using the Service during the twelve (12) months immediately preceding the date of the claim, or one hundred dollars ($100), whichever is greater.
              </p>
              <p className="mt-4">
                <strong>Essential Purpose:</strong> The limitations of damages set forth above are fundamental elements of the basis of the bargain between the Company and you. These limitations shall apply notwithstanding any failure of essential purpose of any limited remedy.
              </p>
              <p className="mt-4">
                <strong>7.5 Exclusions and Limitations</strong>
              </p>
              <p className="mt-4">
                Some jurisdictions do not allow the exclusion of certain warranties or the limitation or exclusion of liability for certain types of damages. Therefore, some of the above limitations may not apply to you. In such jurisdictions, our liability will be limited to the greatest extent permitted by law.
              </p>
              <p className="mt-4">
                Nothing in these Terms limits or excludes our liability for:
              </p>
              <p className="mt-4">
                <strong>Fraud:</strong> Fraud or fraudulent misrepresentation.
              </p>
              <p className="mt-4">
                <strong>Gross Negligence:</strong> Gross negligence or willful misconduct.
              </p>
              <p className="mt-4">
                <strong>Death or Personal Injury:</strong> Death or personal injury caused by our negligence.
              </p>
              <p className="mt-4">
                <strong>Legal Obligations:</strong> Any other liability that cannot be excluded or limited by applicable law.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">8. Dispute Resolution</h2>
              <p>
                This section outlines how disputes between you and the Company will be resolved. Please read this section carefully as it affects your rights regarding how to resolve disputes.
              </p>
              <p className="mt-4">
                <strong>8.1 Governing Law</strong>
              </p>
              <p className="mt-4">
                These Terms and any dispute or claim arising out of or in connection with them or their subject matter or formation (including non-contractual disputes or claims) shall be governed by and construed in accordance with the laws of Singapore, without regard to its conflict of law provisions. The application of the United Nations Convention on Contracts for the International Sale of Goods is expressly excluded.
              </p>
              <p className="mt-4">
                The choice of Singapore law does not deprive you of the protection afforded to you by provisions of the law of the country where you reside that cannot be derogated from by agreement.
              </p>
              <p className="mt-4">
                <strong>8.2 Arbitration Agreement</strong>
              </p>
              <p className="mt-4">
                Except for disputes that qualify for small claims court, any dispute, controversy, or claim arising out of or relating to these Terms, including the formation, interpretation, breach, or termination thereof, including whether the claims asserted are arbitrable, shall be referred to and finally determined by arbitration administered by the Singapore International Arbitration Centre (SIAC) in accordance with the Arbitration Rules of the Singapore International Arbitration Centre ("SIAC Rules") for the time being in force, which rules are deemed to be incorporated by reference in this clause.
              </p>
              <p className="mt-4">
                <strong>Arbitration Procedure:</strong> The arbitration shall be conducted as follows:
              </p>
              <p className="mt-4">
                <strong>Seat and Venue:</strong> The seat of the arbitration shall be Singapore. The venue of the arbitration shall be Singapore, unless the parties agree otherwise.
              </p>
              <p className="mt-4">
                <strong>Language:</strong> The language of the arbitration shall be English.
              </p>
              <p className="mt-4">
                <strong>Number of Arbitrators:</strong> The tribunal shall consist of one arbitrator, appointed in accordance with the SIAC Rules.
              </p>
              <p className="mt-4">
                <strong>Confidentiality:</strong> The arbitration proceedings shall be confidential. The parties shall maintain the confidentiality of the arbitration and the award, including the privacy of the hearings and all materials and communications created for the arbitration, subject to any disclosure required by law.
              </p>
              <p className="mt-4">
                <strong>Award:</strong> The award rendered by the arbitrator shall be final and binding on the parties. Judgment on the award may be entered in any court having jurisdiction thereof.
              </p>
              <p className="mt-4">
                <strong>Costs:</strong> The arbitrator shall have the authority to award costs of the arbitration, including reasonable attorneys' fees, to the prevailing party.
              </p>
              <p className="mt-4">
                <strong>8.3 Class Action Waiver</strong>
              </p>
              <p className="mt-4">
                You and the Company agree that any dispute resolution proceedings, whether in arbitration or in court, will be conducted only on an individual basis and not in a class, consolidated, or representative action. If for any reason a claim proceeds in court rather than in arbitration, both you and the Company waive any right to a jury trial.
              </p>
              <p className="mt-4">
                If a court or arbitrator decides that the class action waiver in this section is unenforceable as to any particular claim or request for relief, then that claim or request for relief must be brought in a court of competent jurisdiction, but all other claims and requests for relief will remain subject to this section.
              </p>
              <p className="mt-4">
                <strong>8.4 Small Claims Court Option</strong>
              </p>
              <p className="mt-4">
                Notwithstanding the foregoing, either party may bring an individual action in a small claims court for disputes or claims within the scope of that court's jurisdiction. This small claims court option is available only so long as the matter remains in such court and is pursued on an individual (non-class, non-representative) basis.
              </p>
              <p className="mt-4">
                <strong>8.5 Right to Opt Out</strong>
              </p>
              <p className="mt-4">
                You have the right to opt out of the arbitration and class action waiver provisions in this section by sending written notice of your decision to opt out to legal@futureaiit.com within thirty (30) days of your first use of the Service. Your notice must include your name, address, and a clear statement that you want to opt out of these arbitration provisions. If you opt out of these arbitration provisions, we will not be bound by them with respect to any disputes with you.
              </p>
              <p className="mt-4">
                <strong>8.6 Injunctive Relief</strong>
              </p>
              <p className="mt-4">
                Notwithstanding the foregoing, either party may seek emergency injunctive relief in any court of competent jurisdiction to protect its intellectual property rights or confidential information pending the appointment of an arbitrator or the arbitrator's determination of the merits of the dispute.
              </p>
              <p className="mt-4">
                <strong>8.7 Time Limitation</strong>
              </p>
              <p className="mt-4">
                To the extent permitted by applicable law, any claim or cause of action arising out of or related to use of the Service or these Terms must be filed within one (1) year after such claim or cause of action arose, or be forever barred.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">9. Data Protection and Privacy</h2>
              <p>
                We are committed to protecting your privacy and personal data. This section provides an overview of our data protection practices. For more detailed information, please refer to our Privacy Policy, which is incorporated by reference into these Terms.
              </p>
              <p className="mt-4">
                <strong>9.1 Data Collection and Use</strong>
              </p>
              <p className="mt-4">
                We collect and process personal data in accordance with our Privacy Policy and applicable data protection laws, including but not limited to the General Data Protection Regulation (GDPR), the California Consumer Privacy Act (CCPA), and other relevant privacy laws in the jurisdictions where we operate.
              </p>
              <p className="mt-4">
                By using the Service, you consent to the collection, processing, and use of your personal data as described in our Privacy Policy. The types of personal data we collect and how we use them include:
              </p>
              <p className="mt-4">
                <strong>Account Information:</strong> We collect and process information necessary to create and maintain your account, such as your name, email address, and password (stored securely).
              </p>
              <p className="mt-4">
                <strong>Professional Information:</strong> We collect and process professional information that you provide in your resumes, cover letters, and other job application materials, including your work history, education, skills, certifications, and other career-related information.
              </p>
              <p className="mt-4">
                <strong>Usage Information:</strong> We collect and process information about how you interact with the Service, including your usage patterns, feature preferences, and other behavioral data that helps us improve the Service.
              </p>
              <p className="mt-4">
                <strong>Payment Information:</strong> For paid subscriptions, we collect and process payment-related information, although actual payment processing is handled by our third-party payment processors.
              </p>
              <p className="mt-4">
                <strong>9.2 Legal Basis for Processing</strong>
              </p>
              <p className="mt-4">
                We process your personal data based on one or more of the following legal grounds:
              </p>
              <p className="mt-4">
                <strong>Contractual Necessity:</strong> Processing is necessary for the performance of our contract with you (these Terms) or to take steps at your request prior to entering into a contract.
              </p>
              <p className="mt-4">
                <strong>Legitimate Interests:</strong> Processing is necessary for our legitimate interests or those of a third party, except where such interests are overridden by your fundamental rights and freedoms.
              </p>
              <p className="mt-4">
                <strong>Legal Obligation:</strong> Processing is necessary for compliance with a legal obligation to which we are subject.
              </p>
              <p className="mt-4">
                <strong>Consent:</strong> You have given consent to the processing of your personal data for one or more specific purposes.
              </p>
              <p className="mt-4">
                <strong>9.3 Security Measures</strong>
              </p>
              <p className="mt-4">
                We implement appropriate technical and organizational measures to protect your data against unauthorized or unlawful processing, accidental loss, destruction, or damage. These security measures include, but are not limited to:
              </p>
              <p className="mt-4">
                <strong>Encryption and Secure Protocols:</strong> We use industry-standard encryption technologies to protect data in transit and at rest. This includes Transport Layer Security (TLS) protocols for data in transit and strong encryption algorithms for data at rest.
              </p>
              <p className="mt-4">
                <strong>Access Controls:</strong> We implement strict access controls that limit access to personal data to authorized personnel only, based on the principle of least privilege. We use role-based access control (RBAC) and require strong authentication methods, including multi-factor authentication for administrative access.
              </p>
              <p className="mt-4">
                <strong>Regular Security Assessments:</strong> We conduct regular security assessments, penetration tests, and vulnerability scans to identify and remediate potential security weaknesses in our systems and applications.
              </p>
              <p className="mt-4">
                <strong>Secure Development Practices:</strong> We follow secure development practices and conduct security code reviews to ensure that security is built into our application from the ground up.
              </p>
              <p className="mt-4">
                <strong>Data Backup and Recovery:</strong> We maintain regular backups of our data and have established procedures for data recovery in case of data loss or corruption, to ensure business continuity and data availability.
              </p>
              <p className="mt-4">
                <strong>Incident Response Plan:</strong> We have developed and regularly test an incident response plan to ensure that we can respond effectively to any security incidents or data breaches.
              </p>
              <p className="mt-4">
                <strong>9.4 Data Retention</strong>
              </p>
              <p className="mt-4">
                We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected, including for the purposes of satisfying any legal, accounting, or reporting requirements, or to fulfill legitimate business interests. The specific retention periods for different types of data are outlined in our Privacy Policy.
              </p>
              <p className="mt-4">
                When determining the appropriate retention period for personal data, we consider:
              </p>
              <p className="mt-4">
                <strong>Legal Requirements:</strong> The amount, nature, and sensitivity of the personal data, and applicable legal requirements or regulations.
              </p>
              <p className="mt-4">
                <strong>Business Needs:</strong> The purposes for which we process your personal data and whether we can achieve those purposes through other means.
              </p>
              <p className="mt-4">
                <strong>Risk Factors:</strong> The potential risk of harm from unauthorized use or disclosure of your personal data.
              </p>
              <p className="mt-4">
                <strong>9.5 Your Data Protection Rights</strong>
              </p>
              <p className="mt-4">
                Depending on your location and applicable data protection laws, you may have certain rights regarding your personal data, which may include:
              </p>
              <p className="mt-4">
                <strong>Right to Access:</strong> The right to request a copy of the personal data we hold about you.
              </p>
              <p className="mt-4">
                <strong>Right to Rectification:</strong> The right to request correction of any inaccurate personal data we hold about you.
              </p>
              <p className="mt-4">
                <strong>Right to Erasure (Right to be Forgotten):</strong> The right to request that we delete your personal data in certain circumstances.
              </p>
              <p className="mt-4">
                <strong>Right to Restrict Processing:</strong> The right to request that we restrict the processing of your personal data in certain circumstances.
              </p>
              <p className="mt-4">
                <strong>Right to Data Portability:</strong> The right to receive a copy of your personal data in a structured, commonly used, and machine-readable format.
              </p>
              <p className="mt-4">
                <strong>Right to Object:</strong> The right to object to the processing of your personal data in certain circumstances.
              </p>
              <p className="mt-4">
                <strong>Right to Withdraw Consent:</strong> The right to withdraw your consent at any time where we rely on consent to process your personal data.
              </p>
              <p className="mt-4">
                To exercise any of these rights, please contact us using the contact information provided in Section 11. We will respond to your request within the timeframe required by applicable law.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">10. Termination</h2>
              <p>
                This section outlines the circumstances under which these Terms and your access to the Service may be terminated, either by you or by us, and the consequences of such termination.
              </p>
              <p className="mt-4">
                <strong>10.1 Termination by You</strong>
              </p>
              <p className="mt-4">
                You may terminate your account and these Terms at any time by following the cancellation process outlined below:
              </p>
              <p className="mt-4">
                <strong>Account Cancellation:</strong> You can cancel your account by accessing the account settings in the Service and following the cancellation instructions, or by contacting our customer support team at support@futureaiit.com with your cancellation request.
              </p>
              <p className="mt-4">
                <strong>Subscription Cancellation:</strong> If you have a paid subscription, you must also cancel your subscription as described in Section 5.3 (Refund and Cancellation Policy) to stop future billing.
              </p>
              <p className="mt-4">
                <strong>Effect of Cancellation:</strong> Upon cancellation of your account:
              </p>
              <p className="mt-4">
                <strong>Access Termination:</strong> Your access to the Service will be terminated at the end of your current billing period (for paid accounts) or immediately (for free accounts).
              </p>
              <p className="mt-4">
                <strong>Data Retention and Deletion:</strong> We will handle your data in accordance with our Privacy Policy and data retention practices. Certain information may be retained for legal, business, or technical reasons, even after account termination.
              </p>
              <p className="mt-4">
                <strong>No Refunds:</strong> As specified in Section 5.3, cancellation does not entitle you to any refunds for the current billing period, except in the specific circumstances outlined therein.
              </p>
              <p className="mt-4">
                <strong>10.2 Termination by Us</strong>
              </p>
              <p className="mt-4">
                We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including but not limited to:
              </p>
              <p className="mt-4">
                <strong>Terms Violation:</strong> If you breach any provision of these Terms or engage in conduct that violates these Terms.
              </p>
              <p className="mt-4">
                <strong>Fraudulent or Illegal Activity:</strong> If we suspect that you are engaged in fraudulent, illegal, or abusive activities, or if your actions may cause financial loss or legal liability for you, other users, or us.
              </p>
              <p className="mt-4">
                <strong>Extended Inactivity:</strong> If your account remains inactive for an extended period, as specified in our account policies.
              </p>
              <p className="mt-4">
                <strong>Non-Payment:</strong> If we are unable to charge your payment method for your subscription fees or if you fail to pay any amounts due.
              </p>
              <p className="mt-4">
                <strong>Regulatory or Legal Requirements:</strong> If required to do so by law, regulation, court order, or other governmental authority.
              </p>
              <p className="mt-4">
                <strong>Service Discontinuation:</strong> If we decide to discontinue the Service or any portion thereof, for business, technical, or operational reasons.
              </p>
              <p className="mt-4">
                <strong>Effect of Termination by Us:</strong> Upon termination of your account by us:
              </p>
              <p className="mt-4">
                <strong>Immediate Access Termination:</strong> Your access to the Service will be terminated immediately.
              </p>
              <p className="mt-4">
                <strong>No Refunds:</strong> Unless required by applicable law or as otherwise specified in these Terms, you will not be entitled to any refunds for any unused portion of your subscription period.
              </p>
              <p className="mt-4">
                <strong>Data Handling:</strong> We will handle your data in accordance with our Privacy Policy and data retention practices.
              </p>
              <p className="mt-4">
                <strong>10.3 Effects of Termination</strong>
              </p>
              <p className="mt-4">
                Upon termination of these Terms, regardless of the cause:
              </p>
              <p className="mt-4">
                <strong>License Termination:</strong> All licenses and rights granted to you under these Terms will immediately cease.
              </p>
              <p className="mt-4">
                <strong>Cessation of Use:</strong> You must cease all use of the Service and any related materials.
              </p>
              <p className="mt-4">
                <strong>Content Access:</strong> You will no longer have access to your account or any content stored in your account, unless otherwise specified in our Privacy Policy or required by applicable law.
              </p>
              <p className="mt-4">
                <strong>Data Export:</strong> Before termination, you are responsible for exporting any data or content that you wish to retain, if the Service provides such export functionality.
              </p>
              <p className="mt-4">
                <strong>10.4 Survival</strong>
              </p>
              <p className="mt-4">
                The following provisions will survive termination of these Terms:
              </p>
              <p className="mt-4">
                <strong>Intellectual Property:</strong> All provisions related to intellectual property rights.
              </p>
              <p className="mt-4">
                <strong>Limitation of Liability:</strong> All limitations of liability and disclaimers.
              </p>
              <p className="mt-4">
                <strong>Dispute Resolution:</strong> All provisions related to dispute resolution, including governing law, arbitration, and class action waiver.
              </p>
              <p className="mt-4">
                <strong>Payment Obligations:</strong> Any payment obligations that accrued before termination.
              </p>
              <p className="mt-4">
                <strong>Other Provisions:</strong> Any other provisions that by their nature should survive termination, including confidentiality obligations and provisions protecting our legal rights.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">11. Contact Information</h2>
              <p>
                If you have any questions, concerns, or feedback regarding these Terms, our Service, or your account, you can contact us through the following channels:
              </p>
              <p className="mt-4">
                <strong>Legal Inquiries:</strong> For legal inquiries, questions about these Terms, or to report potential violations, please contact:
              </p>
              <p className="mt-4">
                Futureaiit Consulting Private Limited<br />
                Email: legal@futureaiit.com<br />
                Address: 123 Tech Park, Innovation District, Bangalore 560001, India<br />
                Phone: +91 80 1234 5678
              </p>
              <p className="mt-4">
                <strong>Customer Support:</strong> For general inquiries, technical support, or account-related issues, please contact:
              </p>
              <p className="mt-4">
                Email: support@futureaiit.com<br />
                Hours of Operation: Monday to Friday, 9:00 AM to 6:00 PM IST (excluding holidays)
              </p>
              <p className="mt-4">
                <strong>Billing and Subscription Support:</strong> For questions related to billing, payments, or subscription management, please contact:
              </p>
              <p className="mt-4">
                Email: billing@futureaiit.com
              </p>
              <p className="mt-4">
                <strong>Data Protection Officer:</strong> For inquiries related to data protection and privacy, please contact our Data Protection Officer:
              </p>
              <p className="mt-4">
                Email: dpo@futureaiit.com
              </p>
              <p className="mt-4">
                <strong>Response Time:</strong> We strive to respond to all inquiries within 2 business days. Complex inquiries may require more time to thoroughly address.
              </p>
              <p className="mt-4">
                <strong>Updates to Contact Information:</strong> Our contact information may change from time to time. The most current contact information will always be available on our website and in the most recent version of these Terms.
              </p>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                By using ATScribe, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
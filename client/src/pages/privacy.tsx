import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Privacy Policy</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <div className="prose max-w-none">
            <div className="mb-8 text-sm text-gray-500">
              <p>Last Updated: July 15, 2024</p>
              <p>Effective Date: July 15, 2024</p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">1. Introduction and Scope</h2>
              <p>
                This Privacy Policy ("Policy") describes how Futureaiit Consulting Private Limited ("Company", "we", "us", or "our") collects, uses, processes, and protects your personal information when you use ATScribe ("Service"). This Policy is incorporated into and forms part of our Terms of Service.
              </p>
              <p className="mt-4">
                By accessing or using the Service, you acknowledge that you have read and understood this Policy. If you do not agree with our policies and practices, please do not use the Service. We may update this Policy from time to time, and we will notify you of any material changes as required by applicable law.
              </p>
              <p className="mt-4">
                We respect your privacy and are committed to protecting it through our compliance with this Policy. This Policy applies to all information we collect through our Service and in email, text, and other electronic communications sent through or in connection with our Service. It does not apply to information collected by any third party, including through any application or content that may link to or be accessible from our Service.
              </p>
              <p className="mt-4">
                Please read this Policy carefully to understand our policies and practices regarding your information and how we will treat it. If you do not agree with our policies and practices, your choice is not to use our Service. By accessing or using our Service, you agree to this Policy.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">2. Information Collection and Processing</h2>
              <p>
                We collect several types of information from and about users of our Service, including information by which you may be personally identified, such as name, postal address, email address, telephone number, or any other identifier by which you may be contacted online or offline ("personal information"); and information about your internet connection, the equipment you use to access our Service, and usage details.
              </p>
              <p className="mt-4">
                <strong>2.1 Information You Provide to Us</strong>
              </p>
              <p className="mt-4">
                The information we collect on or through our Service may include:
              </p>
              <p className="mt-4">
                <strong>Account Information:</strong> When you register with us and set up an account, we collect your full name, email address, and secure password. We also collect information regarding your account preferences and settings. This information is necessary for the adequate performance of the contract between you and us and to allow us to comply with our legal obligations.
              </p>
              <p className="mt-4">
                <strong>Professional Information:</strong> We collect information contained in your resume, cover letter, and other application materials, including but not limited to your professional experience, qualifications, educational background, skills, certifications, and other job-related information you provide. This information is necessary to provide you with our core Service of resume optimization and job application management.
              </p>
              <p className="mt-4">
                <strong>Communications:</strong> When you communicate with us, we collect information about your communication and any information you choose to provide. This may include metadata such as when you contacted us and the subject matter of your inquiry.
              </p>
              <p className="mt-4">
                <strong>Payment Information:</strong> When you subscribe to our premium services, we collect your billing details, including name, address, and payment method information. Your actual payment card information is processed securely by our payment processors, PayPal and Razorpay, and we do not store complete payment card information on our servers.
              </p>
              <p className="mt-4">
                <strong>2.2 Information We Collect Automatically</strong>
              </p>
              <p className="mt-4">
                When you interact with our Service, we automatically collect certain information about your equipment, browsing actions, and patterns, including:
              </p>
              <p className="mt-4">
                <strong>Usage Information:</strong> Details of your visits to our Service, including traffic data, location data, logs, and other communication data and the resources that you access and use on the Service, as well as information about how you interact with our Service, including which features you use and how often you use them.
              </p>
              <p className="mt-4">
                <strong>Device Information:</strong> Information about your computer, mobile device, and internet connection, including your IP address, operating system, browser type, device type, device identifiers, and mobile network information.
              </p>
              <p className="mt-4">
                <strong>Cookies and Similar Technologies:</strong> We and our service providers use cookies, web beacons, and similar technologies to track activity on our Service and to hold certain information. Please see our "Cookies and Tracking Technologies" section below for more information.
              </p>
              <p className="mt-4">
                <strong>2.3 Information from Third Parties</strong>
              </p>
              <p className="mt-4">
                We may receive information about you from third parties, including:
              </p>
              <p className="mt-4">
                <strong>Social Media Platforms:</strong> If you choose to connect your social media accounts to our Service, we may collect information from these platforms in accordance with your privacy settings on those platforms.
              </p>
              <p className="mt-4">
                <strong>Business Partners:</strong> We may receive information about you from our business partners, such as when they co-sponsor an event or promotion with us.
              </p>
              <p className="mt-4">
                <strong>Public Sources:</strong> We may collect information about you from publicly available sources, such as public databases and social media platforms, to supplement the information we collect from you directly.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. Data Security and Protection</h2>
              <p>
                The security of your personal information is important to us. We have implemented reasonable security measures designed to protect your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure.
              </p>
              <p className="mt-4">
                <strong>3.1 Security Measures</strong>
              </p>
              <p className="mt-4">
                We employ a variety of technical, administrative, and physical security measures to protect your personal information, including:
              </p>
              <p className="mt-4">
                <strong>Encryption:</strong> We use industry-standard encryption technologies, including AES-256-GCM encryption for data at rest and TLS 1.3 for data in transit, to protect sensitive information. Additionally, we implement field-level encryption for particularly sensitive data elements and maintain secure key management practices with regular rotation.
              </p>
              <p className="mt-4">
                <strong>Access Controls:</strong> We implement strict access controls through role-based access control (RBAC) systems and require multi-factor authentication (MFA) for administrative access to systems containing personal data. We conduct regular access reviews and audits and adhere to the principle of least privilege, ensuring employees only have access to the information necessary to perform their job functions.
              </p>
              <p className="mt-4">
                <strong>Infrastructure Security:</strong> Our infrastructure is monitored continuously for security threats, and we conduct regular security assessments and vulnerability management activities. We employ intrusion detection and prevention systems and maintain robust DDoS protection measures to ensure service availability.
              </p>
              <p className="mt-4">
                <strong>3.2 Employee Training and Awareness</strong>
              </p>
              <p className="mt-4">
                All our employees, contractors, and agents who have access to personal information are subject to confidentiality obligations and receive regular training on data protection and privacy practices. Background checks are conducted for employees with access to sensitive data, and we maintain a comprehensive security awareness program.
              </p>
              <p className="mt-4">
                <strong>3.3 Incident Response</strong>
              </p>
              <p className="mt-4">
                We have established incident response procedures to address any suspected or actual personal data breach. In the event of a breach that may affect your personal information, we will notify you and any applicable regulators as required by applicable law, including providing information about the breach and steps you can take to protect yourself.
              </p>
              <p className="mt-4">
                <strong>3.4 Limitations</strong>
              </p>
              <p className="mt-4">
                The transmission of information via the internet is not completely secure. Although we do our best to protect your personal information, we cannot guarantee the security of your personal information transmitted to our Service. Any transmission of personal information is at your own risk. We are not responsible for circumvention of any privacy settings or security measures contained on the Service.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">4. Data Processing and Usage</h2>
              <p>
                We use the information we collect about you or that you provide to us, including any personal information, for various purposes. The specific processing activities depend on the context of your interactions with us, your choices, and the products and features you use.
              </p>
              <p className="mt-4">
                <strong>4.1 Legal Basis for Processing</strong>
              </p>
              <p className="mt-4">
                Our processing of your personal information is based on various legal grounds, depending on the nature of the information and the context in which we collect it:
              </p>
              <p className="mt-4">
                <strong>Contractual Necessity:</strong> We process your personal information when necessary to perform our contract with you. This includes providing access to our Service, processing payments, managing your account, and delivering the functionality you have requested. Without processing your information for these purposes, we would be unable to provide you with our Service.
              </p>
              <p className="mt-4">
                <strong>Legitimate Interests:</strong> We process your personal information when we believe it furthers our legitimate interests, such as improving and optimizing our Service, protecting against fraudulent or unauthorized transactions, and communicating with you about Service-related issues. When we process information based on our legitimate interests, we consider and balance any potential impact on you and your rights under data protection laws.
              </p>
              <p className="mt-4">
                <strong>Legal Compliance:</strong> We process your personal information when necessary to comply with applicable laws, regulations, legal processes, or enforceable governmental requests. This may include responding to legal requests from law enforcement or regulatory authorities and protecting our legal rights and interests.
              </p>
              <p className="mt-4">
                <strong>Consent:</strong> In some cases, we process your personal information based on your consent, such as for marketing communications or for sharing your information with certain third parties. You have the right to withdraw your consent at any time, and we provide mechanisms for you to do so.
              </p>
              <p className="mt-4">
                <strong>4.2 Purposes of Processing</strong>
              </p>
              <p className="mt-4">
                We use your personal information for the following purposes:
              </p>
              <p className="mt-4">
                <strong>Providing and Improving the Service:</strong> To provide, maintain, and improve our Service; to develop new products and services; to process and complete transactions; and to monitor and analyze usage and trends to improve your experience with our Service.
              </p>
              <p className="mt-4">
                <strong>Account Management:</strong> To create and maintain your account, authenticate users, and provide customer support.
              </p>
              <p className="mt-4">
                <strong>Communications:</strong> To communicate with you about our Service, respond to your inquiries, send administrative messages, and provide customer support. With your consent, we may also send you marketing communications about our products and services.
              </p>
              <p className="mt-4">
                <strong>Personalization:</strong> To personalize your experience with our Service, including by presenting tailored content and recommendations based on your usage patterns and preferences.
              </p>
              <p className="mt-4">
                <strong>Research and Analytics:</strong> To conduct research and analysis to better understand how users access and use our Service, to develop new features and functionality, and to protect our Service and improve its performance.
              </p>
              <p className="mt-4">
                <strong>Legal and Safety:</strong> To protect our Service, our users, and the public; to detect, prevent, and address fraud, security, or technical issues; and to enforce our Terms of Service and other policies.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">5. Data Retention and Deletion</h2>
              <p>
                We retain your personal information for as long as necessary to fulfill the purposes for which we collected it, including for the purposes of satisfying any legal, accounting, or reporting requirements, and where required for us to assert or defend against legal claims.
              </p>
              <p className="mt-4">
                <strong>5.1 Retention Periods</strong>
              </p>
              <p className="mt-4">
                The length of time we retain your personal information depends on various factors, including the nature of the information, the purposes for which it was collected, and applicable legal requirements. In general, we retain your personal information as follows:
              </p>
              <p className="mt-4">
                <strong>Account Information:</strong> We retain your account information for as long as your account is active or as needed to provide you with our Service. If you close your account, we will retain certain information associated with your account for analytical purposes and recordkeeping integrity, as well as to prevent fraud, collect any fees owed, enforce our Terms of Service, or take other actions permitted by law.
              </p>
              <p className="mt-4">
                <strong>Professional Information:</strong> We retain your professional information (resume, cover letter, etc.) for as long as necessary to provide our Service. If you delete specific content or request deletion of certain information, we will process your request as soon as reasonably practicable.
              </p>
              <p className="mt-4">
                <strong>Payment Information:</strong> We retain payment information as required by applicable tax and accounting laws, typically for a period of seven years after the transaction.
              </p>
              <p className="mt-4">
                <strong>Usage Information:</strong> We retain usage information for a reasonable period of time, typically no more than 24 months, to fulfill the purposes for which it was collected, such as improving our Service and developing new features.
              </p>
              <p className="mt-4">
                <strong>5.2 Data Deletion</strong>
              </p>
              <p className="mt-4">
                When your personal information is no longer required for the purposes for which it was collected or otherwise processed, and we have no legal basis for retaining it, we will either delete or anonymize it. If you request deletion of your personal information, we will take the following steps:
              </p>
              <p className="mt-4">
                <strong>Account Deletion:</strong> Upon your request to delete your account, we will delete or anonymize your personal information within 30 days, except for information that we are required to retain for legal, accounting, or regulatory purposes.
              </p>
              <p className="mt-4">
                <strong>Content Deletion:</strong> You can delete specific content you have provided, such as resumes or cover letters, through your account settings. When you delete content, it will be removed from our systems within a reasonable period of time, except for backup copies which are automatically deleted according to our backup retention schedule.
              </p>
              <p className="mt-4">
                <strong>Retained Information:</strong> Even after you delete your account or specific content, certain information may be retained in our backup systems for a limited period of time. However, this information is not accessible in the ordinary course of business and will be deleted according to our backup retention schedule.
              </p>
              <p className="mt-4">
                <strong>Anonymized Data:</strong> We may retain anonymized data, which cannot be linked to you or your account, for statistical and analytical purposes even after you delete your account.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">6. Data Sharing and Transfers</h2>
              <p>
                We may disclose or share your personal information in certain circumstances, as described below. We require all third parties to respect the security of your personal information and to treat it in accordance with applicable laws.
              </p>
              <p className="mt-4">
                <strong>6.1 Categories of Recipients</strong>
              </p>
              <p className="mt-4">
                <strong>Service Providers:</strong> We share your personal information with service providers who perform services on our behalf, such as:
              </p>
              <p className="mt-4">
                <strong>Payment Processors:</strong> We use trusted third-party payment processors, including PayPal and Razorpay, to process payments for our Service. These processors receive your payment information directly and are themselves responsible for safeguarding your payment data according to their own privacy policies and security standards.
              </p>
              <p className="mt-4">
                <strong>Cloud Infrastructure:</strong> We use cloud service providers to host and deliver our Service. These providers may have access to your personal information but are contractually limited in how they can use this information.
              </p>
              <p className="mt-4">
                <strong>Analytics and Monitoring:</strong> We use analytics and monitoring providers to help us understand how our Service is being used and to improve its performance. These providers collect and analyze aggregated data about how users interact with our Service.
              </p>
              <p className="mt-4">
                <strong>Customer Support:</strong> We use customer support platforms to help us respond to your inquiries and requests. These platforms may have access to your contact information and the contents of your communications with us.
              </p>
              <p className="mt-4">
                <strong>Business Transfers:</strong> If we are involved in a merger, acquisition, sale of assets, bankruptcy, reorganization, dissolution, or other similar transaction or proceeding, your personal information may be transferred as part of that transaction or proceeding. We will notify you of any such change in ownership or control of your personal information.
              </p>
              <p className="mt-4">
                <strong>Legal Requirements:</strong> We may disclose your personal information if required to do so by law or in response to valid requests by public authorities (e.g., a court or government agency). This may include responding to legal requests from law enforcement agencies, regulatory authorities, or other public and government authorities.
              </p>
              <p className="mt-4">
                <strong>Protection of Rights:</strong> We may disclose your personal information when we believe in good faith that disclosure is necessary to protect our rights, enforce our Terms of Service, protect your safety or the safety of others, investigate fraud, or respond to a government request.
              </p>
              <p className="mt-4">
                <strong>With Your Consent:</strong> We may share your personal information with third parties when you have given us your consent to do so. For example, we may share your information with potential employers if you specifically request that we do so.
              </p>
              <p className="mt-4">
                <strong>6.2 International Transfers</strong>
              </p>
              <p className="mt-4">
                We operate globally and may transfer your personal information to countries other than the one in which you reside. These countries may have data protection laws that are different from the laws of your country. However, we take appropriate safeguards to require that your personal information remains protected in accordance with this Policy.
              </p>
              <p className="mt-4">
                When we transfer personal information from the European Economic Area (EEA), the United Kingdom, or Switzerland to countries not deemed to provide an adequate level of data protection, we use one or more of the following legal mechanisms:
              </p>
              <p className="mt-4">
                <strong>Standard Contractual Clauses:</strong> We use Standard Contractual Clauses approved by the European Commission or other appropriate regulatory bodies for transfers of personal information to our service providers in countries outside the EEA, UK, or Switzerland.
              </p>
              <p className="mt-4">
                <strong>Binding Corporate Rules:</strong> For intra-group transfers, we may rely on Binding Corporate Rules approved by relevant data protection authorities.
              </p>
              <p className="mt-4">
                <strong>Adequacy Decisions:</strong> We may transfer data to countries that have been deemed to provide an adequate level of protection for personal data by the European Commission or other relevant regulatory bodies.
              </p>
              <p className="mt-4">
                <strong>Appropriate Security Measures:</strong> We implement appropriate technical and organizational measures to protect your personal information, regardless of where it is processed.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">7. User Rights and Choices</h2>
              <p>
                We respect your right to control your personal information and provide you with choices about how it is used. Depending on your location and applicable law, you may have various rights regarding your personal information.
              </p>
              <p className="mt-4">
                <strong>7.1 Your Rights</strong>
              </p>
              <p className="mt-4">
                You may have the following rights with respect to your personal information:
              </p>
              <p className="mt-4">
                <strong>Right to Access:</strong> You have the right to request a copy of the personal information we hold about you and to check that we are lawfully processing it. We will provide this information in a structured, commonly used, and machine-readable format.
              </p>
              <p className="mt-4">
                <strong>Right to Rectification:</strong> You have the right to request that we correct any incomplete or inaccurate personal information we hold about you. You can update most of your personal information directly through your account settings.
              </p>
              <p className="mt-4">
                <strong>Right to Erasure:</strong> You have the right to request that we delete your personal information in certain circumstances, such as when the information is no longer necessary for the purposes for which it was collected or when you withdraw consent on which processing is based.
              </p>
              <p className="mt-4">
                <strong>Right to Restrict Processing:</strong> You have the right to request that we restrict the processing of your personal information in certain circumstances, such as when you contest the accuracy of the information or object to processing based on legitimate interests.
              </p>
              <p className="mt-4">
                <strong>Right to Data Portability:</strong> You have the right to request that we transfer your personal information to another service or directly to you in a structured, commonly used, and machine-readable format.
              </p>
              <p className="mt-4">
                <strong>Right to Object:</strong> You have the right to object to the processing of your personal information in certain circumstances, such as when processing is based on legitimate interests or for direct marketing purposes.
              </p>
              <p className="mt-4">
                <strong>Right to Not Be Subject to Automated Decision-Making:</strong> You have the right not to be subject to a decision based solely on automated processing, including profiling, which produces legal effects concerning you or similarly significantly affects you, unless such processing is necessary for a contract between you and us, authorized by law, or based on your explicit consent.
              </p>
              <p className="mt-4">
                <strong>Right to Withdraw Consent:</strong> If we rely on your consent to process your personal information, you have the right to withdraw that consent at any time. This will not affect the lawfulness of processing based on your consent before its withdrawal.
              </p>
              <p className="mt-4">
                <strong>7.2 Exercising Your Rights</strong>
              </p>
              <p className="mt-4">
                You can exercise many of your rights directly through your account settings. For rights that cannot be exercised through your account settings, or if you do not have an account, you can submit a request by contacting us using the information provided in the "Contact Information" section.
              </p>
              <p className="mt-4">
                We will respond to your request within the timeframes required by applicable law, typically within 30 days. In some cases, we may need to extend this period, in which case we will notify you. We may request specific information from you to help us confirm your identity and process your request.
              </p>
              <p className="mt-4">
                <strong>7.3 Limitations</strong>
              </p>
              <p className="mt-4">
                In some circumstances, we may not be able to fully comply with your request, such as if it would impact the privacy rights of others, would require disproportionate effort, or if we are legally entitled to deal with the request in a different way. If we cannot comply with your request, we will explain the reasons to you.
              </p>
              <p className="mt-4">
                <strong>7.4 Additional Choices</strong>
              </p>
              <p className="mt-4">
                In addition to the rights described above, you have the following choices regarding your personal information:
              </p>
              <p className="mt-4">
                <strong>Marketing Communications:</strong> You can opt out of receiving marketing communications from us by following the unsubscribe link in any marketing email we send, or by updating your communication preferences in your account settings.
              </p>
              <p className="mt-4">
                <strong>Cookies and Similar Technologies:</strong> You can control the use of cookies through your browser settings and other tools. Please see our "Cookies and Tracking Technologies" section for more information.
              </p>
              <p className="mt-4">
                <strong>Account Deletion:</strong> You can delete your account at any time through your account settings or by contacting us. Please note that some information may be retained even after you delete your account, as described in the "Data Retention and Deletion" section.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">8. Cookies and Tracking Technologies</h2>
              <p>
                We use cookies and similar tracking technologies to track activity on our Service and hold certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier. They are sent to your browser from a website and stored on your device.
              </p>
              <p className="mt-4">
                <strong>8.1 Types of Cookies We Use</strong>
              </p>
              <p className="mt-4">
                <strong>Essential Cookies:</strong> These cookies are necessary for the Service to function properly and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences, logging in, or filling in forms. These cookies enable core functionality such as authentication, security, and session management. You can set your browser to block or alert you about these cookies, but some parts of the site will not work if you do so.
              </p>
              <p className="mt-4">
                <strong>Functional Cookies:</strong> These cookies allow us to remember choices you make and provide enhanced, more personal features. For example, these cookies can be used to remember your login details, language preferences, or layout preferences. They may be set by us or by third-party providers whose services we have added to our pages.
              </p>
              <p className="mt-4">
                <strong>Performance/Analytics Cookies:</strong> These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our Service. They help us to know which pages are the most and least popular and see how visitors move around the site. All information these cookies collect is aggregated and therefore anonymous.
              </p>
              <p className="mt-4">
                <strong>8.2 How to Manage Cookies</strong>
              </p>
              <p className="mt-4">
                Most web browsers allow you to control cookies through their settings preferences. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience, since it will no longer be personalized to you. It may also stop you from saving customized settings like login information.
              </p>
              <p className="mt-4">
                <strong>8.3 Other Tracking Technologies</strong>
              </p>
              <p className="mt-4">
                In addition to cookies, we may use other similar technologies on our Service, such as:
              </p>
              <p className="mt-4">
                <strong>Web Beacons:</strong> Also known as "clear GIFs" or "pixel tags," web beacons are tiny graphics with a unique identifier, similar in function to cookies. While cookies are stored on your hard drive, web beacons are embedded invisibly on web pages. We may use web beacons in connection with our Service to track the activities of users and to help us manage content.
              </p>
              <p className="mt-4">
                <strong>Local Storage Objects:</strong> Like cookies, local storage objects (LSOs) are stored on your device and can be used to store information about your preferences or activities on our Service. Unlike cookies, LSOs are not transmitted to the server and are typically larger and more secure.
              </p>
              <p className="mt-4">
                <strong>8.4 Do Not Track</strong>
              </p>
              <p className="mt-4">
                Some browsers have a "Do Not Track" feature that signals to websites that you visit that you do not want to have your online activity tracked. Given the different ways browsers implement and activate this feature, it is not always clear whether users intend for these signals to be transmitted, or whether they are even aware of them. We currently do not respond to Do Not Track signals.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">9. Children's Privacy</h2>
              <p>
                Our Service is not directed to individuals under the age of 16, and we do not knowingly collect personal information from children under 16. If we learn we have collected or received personal information from a child under 16 without verification of parental consent, we will take steps to delete that information as soon as possible. If you believe we might have any information from or about a child under 16, please contact us using the information provided in the "Contact Information" section.
              </p>
              <p className="mt-4">
                In some jurisdictions, the age threshold may be higher. If this is the case, we will respect the higher age threshold and not collect or process personal information from individuals below such age threshold without verified parental consent.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">10. Changes to This Policy</h2>
              <p>
                We may update this Policy from time to time to reflect changes to our information practices or legal requirements. We will post any changes on this page and, if the changes are significant, we will provide a more prominent notice, which may include sending you an email notification.
              </p>
              <p className="mt-4">
                We encourage you to review this Policy periodically to stay informed about our information practices. If you continue to use our Service after we make changes to this Policy, you are agreeing to be bound by the revised Policy.
              </p>
              <p className="mt-4">
                The date the Policy was last revised is identified at the top of the page. You are responsible for periodically visiting our Service and this Policy to check for any changes.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">11. Contact Information</h2>
              <p>
                If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us at:
              </p>
              <p className="mt-4">
                Futureaiit Consulting Private Limited<br />
                Email: privacy@futureaiit.com<br />
                Address: 123 Tech Park, Innovation District, Bangalore 560001, India<br />
                Phone: +91 80 1234 5678
              </p>
              <p className="mt-4">
                For users in the European Union, please note that we have appointed a data protection officer (DPO) who can be contacted at dpo@futureaiit.com for matters related to data protection and privacy.
              </p>
              <p className="mt-4">
                We will respond to your inquiries and requests within the timeframe required by applicable law, typically within 30 days. In some cases, we may need to extend this period, in which case we will notify you.
              </p>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                By using ATScribe, you acknowledge that you have read, understood, and agree to this Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
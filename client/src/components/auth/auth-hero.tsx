import { CheckCircle } from "lucide-react";

export default function AuthHero() {
  const features = [
    "Track all your job applications in one place",
    "Create professional resumes with multiple templates",
    "Generate customized cover letters",
    "Monitor interview schedules and follow-ups",
    "Get insights on your job search progress"
  ];

  return (
    <div className="relative hidden h-full flex-1 items-center justify-center bg-gradient-to-br from-primary-900 to-primary-700 p-10 text-white dark:from-primary-800 dark:to-primary-900 md:flex">
      <div className="absolute inset-0 bg-cover bg-center opacity-10" 
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80')" }}
      />
      
      <div className="relative z-10 max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-white/10 p-2 backdrop-blur-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-10 w-10"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Prosume
        </h1>
        
        <p className="mt-4 text-lg">
          Your comprehensive platform for managing the job search process, from resume creation to application tracking.
        </p>
        
        <div className="mt-8">
          <ul className="space-y-3 text-left">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-primary-300" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="mt-12 rounded-lg bg-white/10 p-6 backdrop-blur-sm">
          <blockquote>
            <p className="text-lg italic">
              "Prosume helped me organize my job search and land my dream position. The resume templates and application tracking features were game-changers."
            </p>
            <footer className="mt-4 font-medium">
              — Sarah Johnson, Software Engineer
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}

interface ResumeData {
  title: string;
  targetJobTitle: string;
  jobDescription: string;
  // ... existing code ...
}

export default function ResumeBuilder() {
  // ... existing code ...

  return (
    <div className="flex gap-6 p-6">
      <div className="flex-1 space-y-6">
        // ... existing code ...
      </div>
      // ... existing code ...
    </div>
  );
} 
import { useState } from 'react';
import { Zap, Activity, FolderOpen, Focus, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingProps {
  onComplete: () => void;
}

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: Step[] = [
    {
      id: 1,
      title: 'Welcome to Aukaat',
      description: 'Your personal AI productivity operating system',
      icon: Zap,
      content: (
        <div className="text-center space-y-4">
          <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6">
            <Zap className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome to Aukaat!</h2>
          <p className="text-lg text-dark-300 max-w-md mx-auto">
            Aukaat is your intelligent productivity companion that learns your patterns,
            predicts tasks, and helps you stay focused.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-8 max-w-lg mx-auto">
            <Feature icon={Activity} label="Activity Tracking" />
            <Feature icon={Focus} label="Focus Mode" />
            <Feature icon={FolderOpen} label="Auto Organization" />
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: 'Activity Monitoring',
      description: 'Track your work patterns intelligently',
      icon: Activity,
      content: (
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Smart Activity Tracking</h3>
              <p className="text-dark-300">
                Aukaat monitors your active applications and windows to understand your work patterns.
              </p>
            </div>
          </div>

          <div className="glass rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-white">Categorizes work as productive or distracting</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-white">Detects context switches and procrastination</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-white">100% local - your data never leaves your device</span>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-sm text-yellow-200">
              <strong>Permission Required:</strong> You'll need to grant accessibility permissions
              for activity monitoring to work.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: 'Focus Mode',
      description: 'Block distractions and maximize productivity',
      icon: Focus,
      content: (
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <Focus className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Intelligent Focus Mode</h3>
              <p className="text-dark-300">
                Automatically blocks distracting apps and websites when you need to concentrate.
              </p>
            </div>
          </div>

          <div className="glass rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-purple-400" />
              <span className="text-white">Customizable blocked app list</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-purple-400" />
              <span className="text-white">Website blocking via hosts file</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-purple-400" />
              <span className="text-white">Focus score tracking</span>
            </div>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
            <p className="text-sm text-purple-200">
              You can customize blocked apps and websites in Settings later.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      title: 'File Organization',
      description: 'Automatic file management',
      icon: FolderOpen,
      content: (
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <FolderOpen className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Smart File Organization</h3>
              <p className="text-dark-300">
                Automatically organize your downloads and desktop files into categorized folders.
              </p>
            </div>
          </div>

          <div className="glass rounded-lg p-4 space-y-2">
            <h4 className="text-white font-medium mb-2">Default Organization:</h4>
            <div className="space-y-1 text-sm text-dark-300">
              <div>📄 PDFs → Documents/PDFs</div>
              <div>🖼️ Images → Pictures</div>
              <div>🎥 Videos → Videos</div>
              <div>📦 Archives → Archives</div>
              <div>💻 Code files → Code</div>
            </div>
          </div>

          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <p className="text-sm text-green-200">
              Auto-organization can be customized or disabled in Settings.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 5,
      title: 'Ready to Go!',
      description: 'Start maximizing your productivity',
      icon: CheckCircle2,
      content: (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">You're All Set!</h2>
          <p className="text-lg text-dark-300 max-w-md mx-auto">
            Aukaat is ready to help you unlock your true productive potential.
          </p>

          <div className="glass rounded-lg p-6 max-w-lg mx-auto space-y-3 text-left">
            <h4 className="text-white font-bold mb-3">Quick Tips:</h4>
            <div className="flex items-start gap-3">
              <span className="text-primary-400">⌘K</span>
              <span className="text-dark-300">Open command palette for quick actions</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary-400">⌘1-5</span>
              <span className="text-dark-300">Switch between different views</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary-400">⌘⇧D</span>
              <span className="text-dark-300">Quick dashboard toggle</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-dark-950 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex-1 h-1 rounded-full mx-1 transition-all ${
                  index <= currentStep ? 'bg-primary-500' : 'bg-dark-800'
                }`}
              />
            ))}
          </div>
          <div className="text-center text-sm text-dark-400">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="glass rounded-2xl p-8 mb-6"
          >
            {currentStepData.content}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all ${
              currentStep === 0
                ? 'opacity-50 cursor-not-allowed bg-dark-800 text-dark-500'
                : 'bg-dark-800 hover:bg-dark-700 text-white'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <button
            onClick={handleNext}
            className="px-6 py-3 gradient-primary text-white rounded-lg font-medium flex items-center gap-2 hover:shadow-lg hover:shadow-primary-500/50 transition-all"
          >
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 p-4 glass rounded-lg">
      <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary-400" />
      </div>
      <span className="text-xs text-dark-300 text-center">{label}</span>
    </div>
  );
}

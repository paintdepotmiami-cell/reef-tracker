'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/* ── Acclimation Method Data ────────────────────────────────── */

interface Step {
  title: string;
  detail: string;
  duration: number; // seconds, 0 = no timer
  icon: string;
}

interface Method {
  key: string;
  title: string;
  icon: string;
  color: string;
  subtitle: string;
  bestFor: string;
  steps: Step[];
}

const METHODS: Method[] = [
  {
    key: 'drip',
    title: 'Drip Acclimation',
    icon: 'water_drop',
    color: '#4cd6fb',
    subtitle: 'The gold standard for sensitive livestock',
    bestFor: 'Shrimp, Wrasses, Seahorses, sensitive invertebrates',
    steps: [
      { title: 'Turn off display lights', detail: 'Dim or off to reduce stress. Keep room lights low.', duration: 0, icon: 'light_mode' },
      { title: 'Float the bag', detail: 'Float the sealed bag in the sump or a bucket with tank water for temperature equalization. Do NOT float in display to prevent contamination.', duration: 900, icon: 'water' },
      { title: 'Open and pour into bucket', detail: 'Open the bag and pour the animal + water into a clean bucket. You need at least 1-2 cups of water.', duration: 0, icon: 'delete' },
      { title: 'Start the drip line', detail: 'Use airline tubing with a loose knot or drip valve. Adjust to 2-4 drips per second. The goal is to double the water volume in 45-60 minutes.', duration: 3600, icon: 'speed' },
      { title: 'Check water volume', detail: 'Once the water volume has doubled, discard half and continue dripping for another 30-45 minutes.', duration: 2400, icon: 'straighten' },
      { title: 'Transfer to tank', detail: 'Use a net or hands to gently transfer. NEVER pour the shipping/bucket water into your display tank — it may carry diseases and ammonia.', duration: 0, icon: 'move_down' },
      { title: 'Monitor for 24 hours', detail: 'Watch for signs of stress: rapid breathing, hiding excessively, refusal to eat. Keep lights low for the first day.', duration: 0, icon: 'visibility' },
    ],
  },
  {
    key: 'float',
    title: 'Float Method',
    icon: 'sailing',
    color: '#2ff801',
    subtitle: 'Quick and simple for hardy fish',
    bestFor: 'Clownfish, Damsels, hardy fish from trusted LFS',
    steps: [
      { title: 'Dim the lights', detail: 'Turn off display lights. Bright light stresses newly arrived fish.', duration: 0, icon: 'light_mode' },
      { title: 'Float the sealed bag', detail: 'Place the sealed bag on the water surface. This equalizes temperature gradually.', duration: 900, icon: 'water' },
      { title: 'Add tank water — Round 1', detail: 'Open the bag and add ½ cup of tank water. Roll the bag edges to create an air pocket that keeps it floating.', duration: 300, icon: 'add' },
      { title: 'Add tank water — Round 2', detail: 'Add another ½ cup of tank water.', duration: 300, icon: 'add' },
      { title: 'Add tank water — Round 3', detail: 'Add another ½ cup. The bag water should now be ~50% tank water.', duration: 300, icon: 'add' },
      { title: 'Add tank water — Round 4', detail: 'Final addition. Water parameters should now be very close to your display.', duration: 300, icon: 'add' },
      { title: 'Net and transfer', detail: 'Use a net to transfer the fish. Discard the bag water — never add it to your tank.', duration: 0, icon: 'move_down' },
    ],
  },
  {
    key: 'coral_dip',
    title: 'Coral Dip & Acclimation',
    icon: 'waves',
    color: '#FF7F50',
    subtitle: 'Pest prevention for all new corals',
    bestFor: 'All new coral additions — SPS, LPS, and softies',
    steps: [
      { title: 'Prepare dip solution', detail: 'Fill a container with 1 gallon of tank water. Add CoralRx, Bayer, or Coral Revive per the product instructions.', duration: 0, icon: 'science' },
      { title: 'Remove coral from bag', detail: 'Use tongs or gloves. Pour the shipping water into a separate container for inspection (look for hitchhikers).', duration: 0, icon: 'back_hand' },
      { title: 'Dip the coral', detail: 'Place the coral in the dip solution. Gently swirl or use a turkey baster to blast crevices every 2 minutes.', duration: 600, icon: 'waves' },
      { title: 'Inspect the dip water', detail: 'Look for flatworms, nudibranchs, red bugs, or eggs. Use a flashlight. If you find pests, repeat the dip in fresh solution.', duration: 0, icon: 'search' },
      { title: 'Rinse in clean saltwater', detail: 'Prepare a separate container of clean tank water. Swish the coral to remove any dip residue.', duration: 60, icon: 'wash' },
      { title: 'Place in low-flow, low-light area', detail: 'Don\'t put the coral in its final position immediately. Place in a low-stress area for 2-3 days to recover from transit + dip.', duration: 0, icon: 'pin_drop' },
      { title: 'Repeat dip in 7-10 days', detail: 'Many pests lay eggs that survive the first dip. A second dip catches newly hatched pests. Mark your calendar!', duration: 0, icon: 'event_repeat' },
    ],
  },
];

/* ── Main Component ─────────────────────────────────────────── */

export default function AcclimatePage() {
  const [selectedMethod, setSelectedMethod] = useState<Method | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  if (selectedMethod) {
    return (
      <StepByStep
        method={selectedMethod}
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepChange={setCurrentStep}
        onComplete={(step) => setCompletedSteps(prev => new Set([...prev, step]))}
        onBack={() => { setSelectedMethod(null); setCurrentStep(0); setCompletedSteps(new Set()); }}
      />
    );
  }

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div>
        <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#ffb59c] text-xs font-medium uppercase">New Arrivals</p>
        <h1 className="text-3xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">Acclimation Guide</h1>
        <p className="text-sm text-[#c5c6cd] mt-1">Step-by-step protocols with built-in timers</p>
      </div>

      {/* Info card */}
      <div className="bg-[#F1C40F]/5 border border-[#F1C40F]/15 rounded-xl p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-[#F1C40F] text-lg shrink-0 mt-0.5">lightbulb</span>
        <div>
          <p className="text-[10px] text-[#F1C40F] uppercase tracking-widest font-bold mb-1">Why Acclimate?</p>
          <p className="text-sm text-[#c5c6cd] leading-relaxed">
            Shipping water differs in temperature, pH, and salinity from your tank. Abrupt transfer can cause pH shock, osmotic stress, or death. Always acclimate.
          </p>
        </div>
      </div>

      {/* Method Cards */}
      <div className="space-y-3">
        {METHODS.map(method => (
          <button
            key={method.key}
            onClick={() => setSelectedMethod(method)}
            className="w-full bg-[#0d1c32] rounded-2xl p-5 flex items-center gap-4 active:scale-[0.98] transition-transform text-left"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${method.color}15` }}
            >
              <span className="material-symbols-outlined text-2xl" style={{ color: method.color }}>{method.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-[family-name:var(--font-headline)] font-bold text-white text-base">{method.title}</h3>
              <p className="text-[#c5c6cd] text-xs mt-0.5">{method.subtitle}</p>
              <p className="text-[10px] text-[#8f9097] mt-1">
                <span className="material-symbols-outlined text-[10px] align-middle mr-0.5">pets</span>
                {method.bestFor}
              </p>
            </div>
            <span className="material-symbols-outlined text-[#c5c6cd]/40">chevron_right</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Step-by-Step View ──────────────────────────────────────── */

function StepByStep({
  method, currentStep, completedSteps, onStepChange, onComplete, onBack,
}: {
  method: Method;
  currentStep: number;
  completedSteps: Set<number>;
  onStepChange: (step: number) => void;
  onComplete: (step: number) => void;
  onBack: () => void;
}) {
  const step = method.steps[currentStep];
  const progress = completedSteps.size / method.steps.length * 100;

  return (
    <div className="space-y-5 pb-24">
      {/* Back + method title */}
      <div>
        <button onClick={onBack} className="flex items-center gap-1 text-[#c5c6cd] text-sm mb-4 hover:text-[#FF7F50] transition-colors">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Methods
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${method.color}15` }}>
            <span className="material-symbols-outlined text-xl" style={{ color: method.color }}>{method.icon}</span>
          </div>
          <div>
            <h1 className="text-xl font-[family-name:var(--font-headline)] font-bold text-white">{method.title}</h1>
            <p className="text-[10px] text-[#8f9097]">Step {currentStep + 1} of {method.steps.length}</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-1.5 bg-[#1c2a41] rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, backgroundColor: method.color }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
        {method.steps.map((s, i) => (
          <button
            key={i}
            onClick={() => onStepChange(i)}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
              completedSteps.has(i)
                ? 'bg-[#2ff801]/15 text-[#2ff801]'
                : i === currentStep
                  ? 'ring-2 text-white'
                  : 'bg-[#1c2a41] text-[#8f9097]'
            }`}
            style={i === currentStep ? { backgroundColor: `${method.color}20`, outlineColor: method.color, outlineWidth: '2px', outlineStyle: 'solid', outlineOffset: '1px' } as React.CSSProperties : {}}
          >
            {completedSteps.has(i) ? '✓' : i + 1}
          </button>
        ))}
      </div>

      {/* Current step card */}
      <div className="bg-[#0d1c32] rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${method.color}15` }}>
            <span className="material-symbols-outlined text-xl" style={{ color: method.color }}>{step.icon}</span>
          </div>
          <h2 className="font-[family-name:var(--font-headline)] font-bold text-white text-lg flex-1">{step.title}</h2>
        </div>
        <p className="text-sm text-[#c5c6cd] leading-relaxed">{step.detail}</p>

        {/* Timer */}
        {step.duration > 0 && (
          <CountdownTimer
            duration={step.duration}
            color={method.color}
            onComplete={() => onComplete(currentStep)}
          />
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          {currentStep > 0 && (
            <button
              onClick={() => onStepChange(currentStep - 1)}
              className="flex-1 py-3 bg-[#1c2a41] text-[#c5c6cd] rounded-xl text-sm font-semibold hover:bg-[#27354c] transition-colors"
            >
              ← Previous
            </button>
          )}
          {currentStep < method.steps.length - 1 ? (
            <button
              onClick={() => { onComplete(currentStep); onStepChange(currentStep + 1); }}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-colors"
              style={{ backgroundColor: method.color }}
            >
              {step.duration > 0 ? 'Skip Timer → Next' : 'Done → Next'}
            </button>
          ) : (
            <button
              onClick={() => { onComplete(currentStep); onBack(); }}
              className="flex-1 py-3 bg-[#2ff801] text-[#041329] rounded-xl text-sm font-bold hover:bg-[#2ff801]/90 transition-colors"
            >
              ✓ Complete Acclimation
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Countdown Timer ────────────────────────────────────────── */

function CountdownTimer({ duration, color, onComplete }: { duration: number; color: string; onComplete: () => void }) {
  const [remaining, setRemaining] = useState(duration);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const completedRef = useRef(false);

  const startTimer = useCallback(() => {
    setRunning(true);
    completedRef.current = false;
  }, []);

  const pauseTimer = useCallback(() => {
    setRunning(false);
  }, []);

  const resetTimer = useCallback(() => {
    setRunning(false);
    setRemaining(duration);
    completedRef.current = false;
  }, [duration]);

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            setRunning(false);
            if (!completedRef.current) {
              completedRef.current = true;
              // Vibrate if available
              if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate([200, 100, 200, 100, 200]);
              }
              onComplete();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, remaining, onComplete]);

  // Reset when duration changes (step change)
  useEffect(() => {
    setRemaining(duration);
    setRunning(false);
    completedRef.current = false;
  }, [duration]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const progress = ((duration - remaining) / duration) * 100;

  return (
    <div className="bg-[#041329] rounded-xl p-4 space-y-3">
      {/* Timer display */}
      <div className="text-center">
        <p className="text-4xl font-[family-name:var(--font-headline)] font-bold text-white tabular-nums">
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </p>
        <p className="text-[10px] text-[#8f9097] mt-1">
          {remaining === 0 ? '✓ Timer complete!' : running ? 'Running...' : 'Ready to start'}
        </p>
      </div>

      {/* Progress ring */}
      <div className="relative h-1.5 bg-[#1c2a41] rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000"
          style={{ width: `${progress}%`, backgroundColor: remaining === 0 ? '#2ff801' : color }}
        />
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {!running && remaining > 0 && (
          <button
            onClick={startTimer}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5 transition-colors"
            style={{ backgroundColor: color }}
          >
            <span className="material-symbols-outlined text-base">play_arrow</span>
            {remaining === duration ? 'Start' : 'Resume'}
          </button>
        )}
        {running && (
          <button
            onClick={pauseTimer}
            className="flex-1 py-2.5 bg-[#1c2a41] text-[#c5c6cd] rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-[#27354c] transition-colors"
          >
            <span className="material-symbols-outlined text-base">pause</span>
            Pause
          </button>
        )}
        {remaining < duration && (
          <button
            onClick={resetTimer}
            className="py-2.5 px-4 bg-[#1c2a41] text-[#8f9097] rounded-xl text-sm font-semibold hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-base">restart_alt</span>
          </button>
        )}
      </div>
    </div>
  );
}

interface ProgressStep {
  id: string
  label: string
  completed: boolean
  current: boolean
}

interface ProgressIndicatorProps {
  steps: ProgressStep[]
}

export default function ProgressIndicator({ steps }: ProgressIndicatorProps) {
  return (
    <div className="w-full max-w-md mb-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step.current
                    ? 'bg-blue-600 text-white'
                    : step.completed
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step.completed ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`text-xs mt-1 ${
                  step.current ? 'text-blue-600 font-medium' : step.completed ? 'text-green-600' : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-2 ${
                  step.completed ? 'bg-green-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 
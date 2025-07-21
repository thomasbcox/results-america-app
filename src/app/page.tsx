"use client"
import { useState } from "react"
import { 
  GraduationCap, 
  TrendingUp, 
  Leaf, 
  Zap, 
  Heart, 
  Shield, 
  Users, 
  Award, 
  Target
} from "lucide-react"

const logoUrl = "/main-logo.png"
const policyCenterLogo = "/waps-logo.png"

const STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming", "District of Columbia"
]

const TABS = [
  { key: "about", label: "About the App" },
  { key: "mission", label: "Our Mission" },
  { key: "categories", label: "Categories" },
]

export default function SplashPage() {
  const [tab, setTab] = useState("about")
  const [showForm, setShowForm] = useState<null | "signin" | "signup">(null)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [state, setState] = useState("")
  const [status, setStatus] = useState<"idle"|"loading"|"sent"|"error">("idle")
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading")
    setError("")
    // Add name and state to payload for future use
    const res = await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, state })
    })
    if (res.ok) {
      setStatus("sent")
    } else {
      setStatus("error")
      setError("Failed to send magic link. Please try again.")
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header: Logo and nav on white */}
      <div className="w-full bg-white flex flex-col items-center pt-10 pb-6 shadow-sm">
        <img src={logoUrl} alt="Results America" className="h-20 w-auto mb-6" />
        <div className="flex gap-2 mb-6">
          <button
            className={`px-6 py-2 rounded-md border border-gray-300 font-medium transition-colors ${showForm === "signin" ? "bg-white text-gray-900" : "bg-white text-gray-700 hover:bg-gray-100"}`}
            onClick={() => setShowForm("signin")}
          >Sign in</button>
          <button
            className={`px-6 py-2 rounded-md font-medium transition-colors ${showForm === "signup" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"}`}
            onClick={() => setShowForm("signup")}
          >Sign up</button>
        </div>
      </div>

      {/* Create Account Form */}
      {showForm === "signup" && (
        <div className="flex flex-col items-center w-full">
          <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto flex flex-col gap-6 bg-gray-50 px-4 sm:px-0">
            <h2 className="text-2xl font-bold text-center text-gray-900">Create an account</h2>
            <p className="text-center text-gray-500 mb-2">Enter your information below to create an account</p>
            <div>
              <label htmlFor="name" className="block text-sm font-semibold mb-2 text-gray-900">Name</label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full h-10 px-4 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 placeholder-gray-500 bg-white text-sm"
                placeholder="John Doe"
                disabled={status === "loading" || status === "sent"}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-2 text-gray-900">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-10 px-4 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 placeholder-gray-500 bg-white text-sm"
                placeholder="you@example.com"
                disabled={status === "loading" || status === "sent"}
              />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-semibold mb-2 text-gray-900">State</label>
              <select
                id="state"
                required
                value={state}
                onChange={e => setState(e.target.value)}
                className="w-full h-10 px-4 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 bg-white text-sm"
                disabled={status === "loading" || status === "sent"}
              >
                <option value="">Select a state</option>
                {STATES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-blue-600 text-primary-foreground hover:bg-blue-700 h-10 px-4 py-2 w-full"
              disabled={status === "loading" || status === "sent"}
            >
              {status === "loading" ? "Sending..." : "Sign up"}
            </button>
            {status === "sent" && (
              <div className="text-green-600 text-center">Check your email for a magic link!</div>
            )}
            {status === "error" && (
              <div className="text-red-600 text-center">{error}</div>
            )}
            <div className="text-center text-gray-700 text-sm">
              Already have an account?{' '}
              <button type="button" className="text-blue-600 underline font-medium" onClick={() => setShowForm("signin")}>Sign in</button>
            </div>
          </form>
        </div>
      )}

      {/* Footer: white background */}
      <footer className="mt-auto w-full bg-white border-t border-gray-200 py-4">
        <div className="text-center text-xs text-gray-500">© 2025 The Great American Report Card. All rights reserved.</div>
      </footer>
    </div>
  )
}

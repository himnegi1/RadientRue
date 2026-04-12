import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn, signUp } from '../lib/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        await signUp(email, password)
        setSuccess('Account created! You can now sign in.')
        setMode('signin')
      } else {
        await signIn(email, password)
        navigate('/')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-[#0f0e0c]">
      <div className="w-full max-w-sm">
        <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl p-8 shadow-lg dark:shadow-2xl">
          {/* Branding */}
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl text-amber-600 dark:text-amber-400 mb-1">Radiant Rue</h1>
            <p className="text-stone-400 dark:text-zinc-500 text-sm">Salon Dashboard</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-sm px-4 py-2.5 rounded-lg">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-sm px-4 py-2.5 rounded-lg">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-stone-500 dark:text-zinc-400 text-xs mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@radiantrue.com"
                className="w-full bg-stone-50 dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 text-stone-900 dark:text-zinc-200 text-sm px-4 py-2.5 rounded-lg
                  placeholder:text-stone-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30
                  transition-colors"
              />
            </div>
            <div>
              <label className="block text-stone-500 dark:text-zinc-400 text-xs mb-1.5">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Min 6 characters' : 'Enter password'}
                className="w-full bg-stone-50 dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 text-stone-900 dark:text-zinc-200 text-sm px-4 py-2.5 rounded-lg
                  placeholder:text-stone-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30
                  transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 disabled:cursor-not-allowed
                text-white dark:text-zinc-950 font-semibold text-sm py-2.5 rounded-lg transition-colors mt-2"
            >
              {loading
                ? (mode === 'signup' ? 'Creating account...' : 'Signing in...')
                : (mode === 'signup' ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          {/* Toggle */}
          <p className="text-center text-stone-400 dark:text-zinc-500 text-xs mt-5">
            {mode === 'signin' ? (
              <>
                First time?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(''); setSuccess('') }}
                  className="text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 transition-colors"
                >
                  Create admin account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError(''); setSuccess('') }}
                  className="text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 transition-colors"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        <p className="text-center text-stone-300 dark:text-zinc-700 text-xs mt-6">
          Admin access only
        </p>
      </div>
    </div>
  )
}

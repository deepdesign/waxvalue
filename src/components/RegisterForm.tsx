'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms and conditions'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type RegisterFormData = z.infer<typeof registerSchema>

interface RegisterFormProps {
  onSwitchToLogin: () => void
  onRegisterSuccess: (user: any) => void
}

export function RegisterForm({ onSwitchToLogin, onRegisterSuccess }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const password = watch('password')

  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/backend/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Registration failed')
      }

      const result = await response.json()
      
      // Store user data and token
      localStorage.setItem('waxvalue_user', JSON.stringify(result.user))
      localStorage.setItem('waxvalue_token', result.token)
      
      onRegisterSuccess(result.user)
      toast.success('Account created successfully! Welcome to WaxValue!')
    } catch (error) {
      console.error('Registration error:', error)
      toast.error(error instanceof Error ? error.message : 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-600 p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create Account</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Join WaxValue and start optimizing your Discogs pricing</p>
      </div>

      <form onSubmit={handleSubmit(handleRegister)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            {...register('firstName')}
            label="First Name"
            type="text"
            autoComplete="given-name"
            placeholder="First name"
            error={errors.firstName?.message}
            icon={<UserIcon />}
            required
          />

          <FormField
            {...register('lastName')}
            label="Last Name"
            type="text"
            autoComplete="family-name"
            placeholder="Last name"
            error={errors.lastName?.message}
            required
          />
        </div>

        <FormField
          {...register('email')}
          label="Email Address"
          type="email"
          autoComplete="email"
          placeholder="Enter your email"
          error={errors.email?.message}
          icon={<EnvelopeIcon />}
          required
        />

        <div className="space-y-1">
          <div className="relative">
            <FormField
              {...register('password')}
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Create a password"
              error={errors.password?.message}
              icon={<LockClosedIcon />}
              required
              className="pr-10"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center top-7"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400" />
              )}
            </button>
          </div>
          {password && (
            <div className="mt-2 space-y-1" role="status" aria-live="polite">
              <div className="flex items-center text-xs">
                <CheckCircleIcon className={`h-3 w-3 mr-1 ${password.length >= 8 ? 'text-green-500 dark:text-green-400' : 'text-gray-300 dark:text-gray-600'}`} aria-hidden="true" />
                <span className={password.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                  At least 8 characters
                </span>
              </div>
              <div className="flex items-center text-xs">
                <CheckCircleIcon className={`h-3 w-3 mr-1 ${/[A-Z]/.test(password) ? 'text-green-500 dark:text-green-400' : 'text-gray-300 dark:text-gray-600'}`} aria-hidden="true" />
                <span className={/[A-Z]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                  One uppercase letter
                </span>
              </div>
              <div className="flex items-center text-xs">
                <CheckCircleIcon className={`h-3 w-3 mr-1 ${/[a-z]/.test(password) ? 'text-green-500 dark:text-green-400' : 'text-gray-300 dark:text-gray-600'}`} aria-hidden="true" />
                <span className={/[a-z]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                  One lowercase letter
                </span>
              </div>
              <div className="flex items-center text-xs">
                <CheckCircleIcon className={`h-3 w-3 mr-1 ${/\d/.test(password) ? 'text-green-500 dark:text-green-400' : 'text-gray-300 dark:text-gray-600'}`} aria-hidden="true" />
                <span className={/\d/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                  One number
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="relative">
            <FormField
              {...register('confirmPassword')}
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Confirm your password"
              error={errors.confirmPassword?.message}
              icon={<LockClosedIcon />}
              required
              className="pr-10"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center top-7"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400" />
              )}
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                {...register('agreeToTerms')}
                id="agreeToTerms"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="agreeToTerms" className="text-gray-700 dark:text-gray-300">
                I agree to the{' '}
                <a href="#" className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300">
                  Privacy Policy
                </a>
              </label>
            </div>
          </div>
          {errors.agreeToTerms && (
            <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms.message}</p>
          )}
        </div>

        <Button
          type="submit"
          loading={isLoading}
          loadingText="Creating account..."
          className="w-full"
        >
          Create Account
        </Button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Already have an account?</span>
          </div>
        </div>

        <div className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onSwitchToLogin}
            className="w-full"
          >
            Sign in instead
          </Button>
        </div>
      </div>
    </div>
  )
}





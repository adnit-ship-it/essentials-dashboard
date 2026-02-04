"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase/client"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push("/")
    } catch (error: any) {
      const message =
        error?.code === "auth/invalid-credential" || error?.code === "auth/wrong-password"
          ? "Invalid email or password"
          : error?.message || "An error occurred. Please try again."
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Banner Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <Image
          src="/login-banner.webp"
          alt="Login banner"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-12 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex justify-center lg:justify-start">
            <Image
              src="/cv-logo.png"
              alt="CareValidate Logo"
              width={180}
              height={60}
              className="h-auto"
              priority
            />
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Log In
            </h1>
            <p className="text-gray-600">
              Welcome back! Please enter your details.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-12 rounded-lg border-gray-300 focus:border-teal-500 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-12 rounded-lg border-gray-300 focus:border-teal-500 focus:ring-teal-500"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition-colors"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
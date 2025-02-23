"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronDown, User, Mail, Phone, Lock, Briefcase, Users } from "lucide-react"

const Register: React.FC = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: "",
    f_name: "",
    l_name: "",
    phone_no: "",
    password: "",
    company_name: "",
    industry_type: "Fashion",
    job_title: "",
    company_size: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted", formData)
    navigate("/") // Redirect after registration (modify as needed)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-semibold text-gray-900">Create Your Account</h1>
        </div>
      </header>

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      placeholder="you@example.com"
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      name="password"
                      id="password"
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      placeholder="Minimum 8 characters"
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="f_name" className="block text-sm font-medium text-gray-700">
                    First name
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="f_name"
                      id="f_name"
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="l_name" className="block text-sm font-medium text-gray-700">
                    Last name
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="l_name"
                      id="l_name"
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="phone_no" className="block text-sm font-medium text-gray-700">
                    Phone number (optional)
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      name="phone_no"
                      id="phone_no"
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      placeholder="Phone number"
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                    Company Name
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Briefcase className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="company_name"
                      id="company_name"
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="industry_type" className="block text-sm font-medium text-gray-700">
                    Industry Type
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <select
                      id="industry_type"
                      name="industry_type"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      onChange={handleChange}
                    >
                      <option value="Fashion">Fashion</option>
                      <option value="Retail">Retail</option>
                      <option value="Manufacturing">Manufacturing</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="job_title" className="block text-sm font-medium text-gray-700">
                    Job Title
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Briefcase className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="job_title"
                      id="job_title"
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="company_size" className="block text-sm font-medium text-gray-700">
                    Company Size
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Users className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="company_size"
                      id="company_size"
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  CREATE ACCOUNT
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">&copy; 2023 Your Company Name. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default Register


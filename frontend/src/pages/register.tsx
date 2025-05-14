import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, User, Phone, Lock, Building2, Briefcase, Users, Factory } from 'lucide-react';
import "../assets/register.css";

const Register: React.FC = () => {
    const navigate = useNavigate();

    // Keep the original form data structure for backend compatibility
    const [formData, setFormData] = useState({
        email: '',
        username: '', // For Django's default username requirement
        first_name: '',
        last_name: '',
        phone: '',
        password: '',
        company_name: '',
        industry_type: 'Fashion',
        job_title: '',
        company_size: ''
    });

    const [message, setMessage] = useState('');

    // Map the new field names to the backend field names
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // Map the new field names to the backend field names
        const fieldMapping: { [key: string]: string } = {
            'f_name': 'first_name',
            'l_name': 'last_name',
            'phone_no': 'phone',
            // For other fields, the names are the same
        };

        const backendFieldName = fieldMapping[name] || name;

        // If this is a first or last name field, also update the username
        if (name === 'f_name' || name === 'l_name') {
            const updatedFormData = { ...formData, [backendFieldName]: value };

            // Create a username from first_name and last_name if both exist
            if (name === 'f_name' && formData.last_name) {
                updatedFormData.username = `${value.toLowerCase()}_${formData.last_name.toLowerCase()}`;
            } else if (name === 'l_name' && formData.first_name) {
                updatedFormData.username = `${formData.first_name.toLowerCase()}_${value.toLowerCase()}`;
            }

            setFormData(updatedFormData);
        } else {
            setFormData({ ...formData, [backendFieldName]: value });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Send POST request to Django backend
            const response = await axios.post('http://127.0.0.1:8000/api/users/register/', formData);
            console.log('Registration successful:', response.data);
            setMessage('Registration successful! Redirecting to login...');

            // Reset form after successful registration
            setFormData({
                email: '',
                username: '',
                first_name: '',
                last_name: '',
                phone: '',
                password: '',
                company_name: '',
                industry_type: 'Fashion',
                job_title: '',
                company_size: ''
            });

            // Redirect after 2 seconds
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            console.error('Registration failed:', error);
            setMessage('Registration failed. Please try again.');
        }
    };

    return (
        <div className="register-container">
            <div className="register-content">
                <div className="register-left">
                    <div className="logo-section">
                        <div className="welcome-text">
                            <h1 className='tx1'>Welcome to<br />Streamlineer<span className="accent-dot">.</span></h1>
                            <p className='tx2'>Create an account to get started with our intuitive platform for building powerful inspection templates.</p>
                        </div>
                    </div>
                </div>

                <div className="register-right">
                    <form onSubmit={handleSubmit} className="register-form">
                        <h2>Create Account</h2>

                        <div className="form-row">
                            <div className="input-group">
                                <User className="input-icon" size={18} />
                                <input
                                    type="text"
                                    id="f_name"
                                    name="f_name"
                                    required
                                    placeholder="First Name"
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="input-group">
                                <User className="input-icon" size={18} />
                                <input
                                    type="text"
                                    id="l_name"
                                    name="l_name"
                                    required
                                    placeholder="Last Name"
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <Mail className="input-icon" size={18} />
                            <input
                                type="email"
                                id="email"
                                name="email"
                                required
                                placeholder="Email Address"
                                onChange={handleChange}
                            />
                        </div>

                        <div className="input-group">
                            <Lock className="input-icon" size={18} />
                            <input
                                type="password"
                                id="password"
                                name="password"
                                required
                                placeholder="Password"
                                onChange={handleChange}
                            />
                        </div>

                        <div className="input-group">
                            <Phone className="input-icon" size={18} />
                            <input
                                type="tel"
                                id="phone_no"
                                name="phone_no"
                                placeholder="Phone Number (Optional)"
                                onChange={handleChange}
                            />
                        </div>

                        <div className="input-group">
                            <Building2 className="input-icon" size={18} />
                            <input
                                type="text"
                                id="company_name"
                                name="company_name"
                                required
                                placeholder="Company Name"
                                onChange={handleChange}
                            />
                        </div>

                        <div className="input-group">
                            <Factory className="input-icon" size={18} />
                            <select
                                id="industry_type"
                                name="industry_type"
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Industry</option>
                                <option value="Manufacturing">Manufacturing</option>
                                <option value="Construction">Construction</option>
                                <option value="Retail">Retail</option>
                                <option value="Healthcare">Healthcare</option>
                                <option value="Food & Beverage">Food & Beverage</option>
                                <option value="Logistics">Logistics</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <Briefcase className="input-icon" size={18} />
                            <input
                                type="text"
                                id="job_title"
                                name="job_title"
                                required
                                placeholder="Job Title"
                                onChange={handleChange}
                            />
                        </div>

                        <div className="input-group">
                            <Users className="input-icon" size={18} />
                            <input
                                type="number"
                                id="company_size"
                                name="company_size"
                                required
                                placeholder="Company Size"
                                onChange={handleChange}
                            />
                        </div>

                        <button
                            type="submit"
                            className="submit-btn"
                        >
                            Create Account
                        </button>

                        {/* Display registration message */}
                        {message && <p className="register-message">{message}</p>}

                        <p className="login-link">
                            Already have an account? <a
                                href="/login"
                            >
                                Sign in
                            </a>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;

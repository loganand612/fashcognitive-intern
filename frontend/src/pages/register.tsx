import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, User, Phone, Lock, Building2, Briefcase, Users, Factory } from 'lucide-react';
import "../assets/register.css";
import flag from "../assets/img/flag.jpg";

const Register: React.FC = () => {
    const navigate = useNavigate();
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
                        <img src={flag} alt="Fashcognitive Logo" className="company-logo" />
                        <div className="welcome-text">
                            <h1 className='tx1'>Welcome to<br />Fashcognitive</h1>
                            <p className='tx2'>Create an account to get started with our AI-powered solutions for the apparel industry.</p>
                        </div>
                    </div>
                </div>
                
                <div className="register-right">
                    <form onSubmit={handleSubmit} className="register-form">
                        <h2>Create Account</h2>

                        {/* Username input for Django's default requirement */}
                        <div className="input-group">
                            <User className="input-icon" size={18} />
                            <input 
                                type="text" 
                                id="username" 
                                name="username" 
                                required 
                                placeholder="Username"
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-row">
                            <div className="input-group">
                                <User className="input-icon" size={18} />
                                <input 
                                    type="text" 
                                    id="first_name" 
                                    name="first_name" 
                                    required 
                                    placeholder="First Name"
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="input-group">
                                <User className="input-icon" size={18} />
                                <input 
                                    type="text" 
                                    id="last_name" 
                                    name="last_name" 
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
                                id="phone" 
                                name="phone" 
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
                                <option value="Fashion">Fashion</option>
                                <option value="Retail">Retail</option>
                                <option value="Manufacturing">Manufacturing</option>
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

                        <button type="submit" className="submit-btn">
                            Create Account
                        </button>

                        {/* Display registration message */}
                        {message && <p className="register-message">{message}</p>}

                        <p className="login-link">
                            Already have an account? <a href="/login">Sign in</a>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;

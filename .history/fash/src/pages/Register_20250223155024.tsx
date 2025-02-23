import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        f_name: '',
        l_name: '',
        phone_no: '',
        password: '',
        company_name: '',
        industry_type: 'Fashion',
        job_title: '',
        company_size: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form submitted', formData);
        navigate('/');
    };

    return (
        <div className="register-container">
            <div className="register-content">
                <div className="register-left">
                    <div className="welcome-text">
                        <h1>Welcome to Our Platform</h1>
                        <p>Create an account to get started with our services</p>
                    </div>
                </div>
                
                <div className="register-right">
                    <form onSubmit={handleSubmit} className="register-form">
                        <h2>Create Account</h2>
                        
                        <div className="form-row">
                            <div className="input-group">
                                <input 
                                    type="text" 
                                    id="f_name" 
                                    name="f_name" 
                                    required 
                                    onChange={handleChange}
                                />
                                <label htmlFor="f_name">First Name</label>
                            </div>
                            
                            <div className="input-group">
                                <input 
                                    type="text" 
                                    id="l_name" 
                                    name="l_name" 
                                    required 
                                    onChange={handleChange}
                                />
                                <label htmlFor="l_name">Last Name</label>
                            </div>
                        </div>

                        <div className="input-group">
                            <input 
                                type="email" 
                                id="email" 
                                name="email" 
                                required 
                                onChange={handleChange}
                            />
                            <label htmlFor="email">Email Address</label>
                        </div>

                        <div className="input-group">
                            <input 
                                type="password" 
                                id="password" 
                                name="password" 
                                required 
                                onChange={handleChange}
                            />
                            <label htmlFor="password">Password</label>
                        </div>

                        <div className="input-group">
                            <input 
                                type="tel" 
                                id="phone_no" 
                                name="phone_no" 
                                onChange={handleChange}
                            />
                            <label htmlFor="phone_no">Phone Number (Optional)</label>
                        </div>

                        <div className="input-group">
                            <input 
                                type="text" 
                                id="company_name" 
                                name="company_name" 
                                required 
                                onChange={handleChange}
                            />
                            <label htmlFor="company_name">Company Name</label>
                        </div>

                        <div className="input-group">
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
                            <label htmlFor="industry_type">Industry Type</label>
                        </div>

                        <div className="input-group">
                            <input 
                                type="text" 
                                id="job_title" 
                                name="job_title" 
                                required 
                                onChange={handleChange}
                            />
                            <label htmlFor="job_title">Job Title</label>
                        </div>

                        <div className="input-group">
                            <input 
                                type="number" 
                                id="company_size" 
                                name="company_size" 
                                required 
                                onChange={handleChange}
                            />
                            <label htmlFor="company_size">Company Size</label>
                        </div>

                        <button type="submit" className="submit-btn">
                            Create Account
                        </button>

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
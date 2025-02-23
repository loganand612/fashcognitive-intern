import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, User, Phone, Lock, Building2, Briefcase, Users, Factory } from 'lucide-react';
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
                    <div className="logo-container">
                    <img src={logs} alt="GoBooks Logo" className="logo" />
                        <img src={logs} 
                            alt="Fashcognitive Logo" 
                            className="company-logo"
                        />
                    </div>
                    <div className="welcome-text">
                        <h1>Welcome to Fashcognitive</h1>
                        <p>Create an account to get started with our AI-powered solutions for the apparel industry. Join thousands of professionals who trust our platform.</p>
                    </div>
                </div>
                
                <div className="register-right">
                    <form onSubmit={handleSubmit} className="register-form">
                        <h2>Create Account</h2>
                        
                        <div className="form-row">
                            <div className="input-group">
                                <User className="input-icon" size={20} />
                                <input 
                                    type="text" 
                                    id="f_name" 
                                    name="f_name" 
                                    required 
                                    placeholder=" "
                                    onChange={handleChange}
                                />
                                <label htmlFor="f_name">First Name</label>
                            </div>
                            
                            <div className="input-group">
                                <User className="input-icon" size={20} />
                                <input 
                                    type="text" 
                                    id="l_name" 
                                    name="l_name" 
                                    required 
                                    placeholder=" "
                                    onChange={handleChange}
                                />
                                <label htmlFor="l_name">Last Name</label>
                            </div>
                        </div>

                        <div className="input-group">
                            <Mail className="input-icon" size={20} />
                            <input 
                                type="email" 
                                id="email" 
                                name="email" 
                                required 
                                placeholder=" "
                                onChange={handleChange}
                            />
                            <label htmlFor="email">Email Address</label>
                        </div>

                        <div className="input-group">
                            <Lock className="input-icon" size={20} />
                            <input 
                                type="password" 
                                id="password" 
                                name="password" 
                                required 
                                placeholder=" "
                                onChange={handleChange}
                            />
                            <label htmlFor="password">Password</label>
                        </div>

                        <div className="input-group">
                            <Phone className="input-icon" size={20} />
                            <input 
                                type="tel" 
                                id="phone_no" 
                                name="phone_no" 
                                placeholder=" "
                                onChange={handleChange}
                            />
                            <label htmlFor="phone_no">Phone Number (Optional)</label>
                        </div>

                        <div className="input-group">
                            <Building2 className="input-icon" size={20} />
                            <input 
                                type="text" 
                                id="company_name" 
                                name="company_name" 
                                required 
                                placeholder=" "
                                onChange={handleChange}
                            />
                            <label htmlFor="company_name">Company Name</label>
                        </div>

                        <div className="input-group">
                            <Factory className="input-icon" size={20} />
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
                            <Briefcase className="input-icon" size={20} />
                            <input 
                                type="text" 
                                id="job_title" 
                                name="job_title" 
                                required 
                                placeholder=" "
                                onChange={handleChange}
                            />
                            <label htmlFor="job_title">Job Title</label>
                        </div>

                        <div className="input-group">
                            <Users className="input-icon" size={20} />
                            <input 
                                type="number" 
                                id="company_size" 
                                name="company_size" 
                                required 
                                placeholder=" "
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
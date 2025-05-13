import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, User, Phone, Lock, Building2, Briefcase, Users, Factory, MousePointer } from 'lucide-react';
import './Register.css';
import logs from "./assets/logs.png";

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [cursorVariant, setCursorVariant] = useState<string>("");
    const cursorRef = useRef<HTMLDivElement>(null);

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

    // Handle mouse movement for custom cursor
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    // Update cursor position
    useEffect(() => {
        if (cursorRef.current) {
            cursorRef.current.style.left = `${mousePosition.x}px`;
            cursorRef.current.style.top = `${mousePosition.y}px`;
        }
    }, [mousePosition]);

    // Cursor hover effects
    const enterButton = () => setCursorVariant("button");
    const enterLink = () => setCursorVariant("link");
    const leaveHover = () => setCursorVariant("");

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
            {/* Custom cursor */}
            <div ref={cursorRef} className={`custom-cursor ${cursorVariant}`}>
                <MousePointer size={12} />
            </div>

            <div className="register-content">
                <div className="register-left">
                    <div className="logo-section">
                        <img src={logs} alt="Fashcognitive Logo" className="company-logo" />
                        <div className="welcome-text">
                            <h1 className='tx1'>Welcome to<br />Fashcognitive<span className="accent-dot">.</span></h1>
                            <p className='tx2'>Create an account to get started with our AI-powered solutions for the apparel industry.</p>
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
                                    onMouseEnter={enterButton}
                                    onMouseLeave={leaveHover}
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
                                    onMouseEnter={enterButton}
                                    onMouseLeave={leaveHover}
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
                                onMouseEnter={enterButton}
                                onMouseLeave={leaveHover}
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
                                onMouseEnter={enterButton}
                                onMouseLeave={leaveHover}
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
                                onMouseEnter={enterButton}
                                onMouseLeave={leaveHover}
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
                                onMouseEnter={enterButton}
                                onMouseLeave={leaveHover}
                            />
                        </div>

                        <div className="input-group">
                            <Factory className="input-icon" size={18} />
                            <select
                                id="industry_type"
                                name="industry_type"
                                onChange={handleChange}
                                required
                                onMouseEnter={enterButton}
                                onMouseLeave={leaveHover}
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
                                onMouseEnter={enterButton}
                                onMouseLeave={leaveHover}
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
                                onMouseEnter={enterButton}
                                onMouseLeave={leaveHover}
                            />
                        </div>

                        <button
                            type="submit"
                            className="submit-btn"
                            onMouseEnter={enterButton}
                            onMouseLeave={leaveHover}
                        >
                            Create Account
                        </button>

                        <p className="login-link">
                            Already have an account? <a
                                href="/login"
                                onMouseEnter={enterLink}
                                onMouseLeave={leaveHover}
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
import React, { useState } from "react";

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    password: "",
    companyName: "",
    industryType: "Fashion",
    jobTitle: "",
    companySize: "",
  });

  const [message, setMessage] = useState(""); // For success/error messages

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission with API call
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:8000/api/users/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          f_name: formData.firstName,
          l_name: formData.lastName,
          phone_no: formData.phone,
          password: formData.password,
          company_name: formData.companyName,
          industry_type: formData.industryType,
          job_title: formData.jobTitle,
          company_size: formData.companySize,
        }),
      });

      if (response.ok) {
        setMessage("User registered successfully!");
        // Reset form after success
        setFormData({
          email: "",
          firstName: "",
          lastName: "",
          phone: "",
          password: "",
          companyName: "",
          industryType: "Fashion",
          jobTitle: "",
          companySize: "",
        });
      } else {
        const errorData = await response.json();
        console.error("Registration failed:", errorData);
        setMessage("Registration failed. Please check your inputs.");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("An error occurred. Please try again later.");
    }
  };

  return (
    <div className="container">
      <section className="form-section">
        <div className="form-container">
          <form onSubmit={handleSubmit}>
            {message && <p className="form-message">{message}</p>} {/* Display messages */}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group name-group">
              <div>
                <label htmlFor="firstName">First name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName">Last name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone number (optional)</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone number"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Minimum 8 characters"
              />
            </div>

            <div className="form-group">
              <label htmlFor="companyName">Company Name</label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="industryType">Industry Type</label>
              <select
                id="industryType"
                name="industryType"
                value={formData.industryType}
                onChange={handleChange}
              >
                <option value="Fashion">Fashion</option>
                <option value="Retail">Retail</option>
                <option value="Manufacturing">Manufacturing</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="jobTitle">Job Title</label>
              <input
                type="text"
                id="jobTitle"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="companySize">Company Size</label>
              <input
                type="number"
                id="companySize"
                name="companySize"
                value={formData.companySize}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="submit-button">CREATE ACCOUNT</button>
          </form>
        </div>
      </section>

      <section className="image-section">
        <div className="image-content">
          <div className="image-logo">
            <img src="/static/img/flag.jpg" alt="Fashcognitive Logo" />
          </div>
          <h1>Transform Your Apparel Business</h1>
          <p>Join Fashcognitive and experience the future of AI-powered apparel solutions.</p>
        </div>
      </section>
    </div>
  );
};

export default Register;

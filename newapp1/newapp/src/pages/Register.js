import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    userId: "",
    role: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getRoleLabel = (role) => {
    switch (role) {
      case "faculty":
        return "Faculty ID";
      case "student":
        return "Student ID";
      default:
        return "User ID";
    }
  };

  // ✅ Validation function
  const validate = () => {
    const errors = {};

    // Name
    if (!formData.name.trim()) errors.name = "Name is required";

    // Email validation
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else {
      const emailPattern = /^sng24[a-zA-Z0-9._-]+@sngce\.ac\.in$/;
      if (!emailPattern.test(formData.email)) {
        errors.email = "Email must be in the format sng24xxxx@sngce.ac.in";
      }
    }

    // Role
    if (!formData.role) errors.role = "Please select a role";

    // User ID validation
    if (!formData.userId.trim()) {
      errors.userId = `${getRoleLabel(formData.role)} is required`;
    } else {
      if (formData.role === "student") {
        const studentPattern = /^SNG[a-zA-Z0-9._-]+$/;
        if (!studentPattern.test(formData.userId)) {
          errors.userId = "Student ID must start with 'SNG' (e.g., SNG12345)";
        }
      } else if (formData.role === "faculty") {
        const facultyPattern = /^sng24[a-zA-Z0-9._-]+$/;
        if (!facultyPattern.test(formData.userId)) {
          errors.userId = "Faculty ID must start with 'sng24' (e.g., sng24fac01)";
        }
      }
    }

    // Password
    if (!formData.password) errors.password = "Password is required";
    else if (formData.password.length < 6)
      errors.password = "Password must be at least 6 characters";

    // Confirm password
    if (!formData.confirmPassword)
      errors.confirmPassword = "Confirm your password";
    else if (formData.password !== formData.confirmPassword)
      errors.confirmPassword = "Passwords do not match";

    return errors;
  };

  // Input change handler
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:5000/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await response.json();
        if (response.ok) {
          alert("✅ Registration successful! Please login.");
          navigate("/login");
        } else {
          setErrors({ server: data.error || "Registration failed" });
        }
      } catch (err) {
        console.error(err);
        setErrors({ server: "Server error. Try again later." });
      } finally {
        setLoading(false);
      }
    }
  };

  const getUserIdPlaceholder = () => {
    if (formData.role === "student") return "Enter Student ID ";
    if (formData.role === "faculty") return "Enter Faculty ID ";
    return "Enter User ID";
  };

  return (
    <div
      style={{
        maxWidth: "450px",
        margin: "50px auto",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "10px",
        background: "white",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          color: "#185a9d",
          marginBottom: "20px",
        }}
      >
        User Registration
      </h2>

      {errors.server && (
        <div
          style={{
            color: "red",
            textAlign: "center",
            background: "#ffe6e6",
            padding: "10px",
            borderRadius: "5px",
            marginBottom: "15px",
            border: "1px solid red",
          }}
        >
          {errors.server}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Name */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Name:
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "10px",
              border: errors.name ? "1px solid red" : "1px solid #ccc",
              borderRadius: "5px",
              fontSize: "16px",
            }}
            placeholder="Enter your full name"
          />
          {errors.name && <span style={{ color: "red", fontSize: "14px" }}>{errors.name}</span>}
        </div>

        {/* Email */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Email:
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "10px",
              border: errors.email ? "1px solid red" : "1px solid #ccc",
              borderRadius: "5px",
              fontSize: "16px",
            }}
            placeholder="Enter your college email id"
          />
          {errors.email && <span style={{ color: "red", fontSize: "14px" }}>{errors.email}</span>}
        </div>

        {/* Role */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Role:
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "10px",
              border: errors.role ? "1px solid red" : "1px solid #ccc",
              borderRadius: "5px",
              fontSize: "16px",
            }}
          >
            <option value="">-- Select Role --</option>
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
          </select>
          {errors.role && <span style={{ color: "red", fontSize: "14px" }}>{errors.role}</span>}
        </div>

        {/* User ID */}
        {formData.role && (
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              {getRoleLabel(formData.role)}:
            </label>
            <input
              type="text"
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "10px",
                border: errors.userId ? "1px solid red" : "1px solid #ccc",
                borderRadius: "5px",
                fontSize: "16px",
              }}
              placeholder={getUserIdPlaceholder()}
            />
            {errors.userId && <span style={{ color: "red", fontSize: "14px" }}>{errors.userId}</span>}
          </div>
        )}

        {/* Password */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Password:
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "10px",
              border: errors.password ? "1px solid red" : "1px solid #ccc",
              borderRadius: "5px",
              fontSize: "16px",
            }}
            placeholder="Enter password (min. 6 characters)"
          />
          {errors.password && <span style={{ color: "red", fontSize: "14px" }}>{errors.password}</span>}
        </div>

        {/* Confirm Password */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Confirm Password:
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "10px",
              border: errors.confirmPassword ? "1px solid red" : "1px solid #ccc",
              borderRadius: "5px",
              fontSize: "16px",
            }}
            placeholder="Confirm your password"
          />
          {errors.confirmPassword && (
            <span style={{ color: "red", fontSize: "14px" }}>{errors.confirmPassword}</span>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            background: loading ? "#ccc" : "#43cea2",
            color: "white",
            border: "none",
            borderRadius: "5px",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "16px",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: "15px" }}>
        <p>
          Already have an account?{" "}
          <a href="/login" style={{ color: "#185a9d", textDecoration: "none" }}>
            Login here
          </a>
        </p>
      </div>
    </div>
  );
}

export default Register;

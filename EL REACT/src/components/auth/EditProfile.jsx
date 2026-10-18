import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  Camera,
  ArrowLeft,
  Save,
  CheckCircle2,
  X,
  ShieldCheck,
} from "lucide-react";

import {
  getProfile,
  updateProfile,
  updateProfileImage,
  changePassword,
  sendEmailChangeOTP,
  verifyEmailChangeOTP,
} from "../../services/profileService";
import Navbar from "../common/Navbar";


/* =========================
   IMAGE URL HELPER
========================= */

const getImageUrl = (image) => {
  if (!image) {
    return "";
  }

  if (
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    return image;
  }

  if (image.startsWith("/")) {
    return `http://localhost:5000${image}`;
  }

  return `http://localhost:5000/${image}`;
};


const EditProfile = () => {
  const navigate = useNavigate();

  /* =========================
     PROFILE STATE
  ========================= */

  const [formData, setFormData] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem("user") || "null");
      if (cached) {
        return {
          fullName: cached.fullName || "",
          email: cached.email || "",
          phoneNumber: cached.phoneNumber || "",
          dateOfBirth: cached.dateOfBirth ? cached.dateOfBirth.substring(0, 10) : "",
          gender: cached.gender || "",
          address: {
            street: cached.address?.street || "",
            city: cached.address?.city || "",
            state: cached.address?.state || "",
            pincode: cached.address?.pincode || "",
          },
        };
      }
    } catch {}
    return {
      fullName: "",
      email: "",
      phoneNumber: "",
      dateOfBirth: "",
      gender: "",
      address: {
        street: "",
        city: "",
        state: "",
        pincode: "",
      },
    };
  });

  const [profileImage, setProfileImage] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem("user") || "null");
      return cached?.profileImage ? getImageUrl(cached.profileImage) : "";
    } catch {
      return "";
    }
  });
  const [imageFile, setImageFile] = useState(null);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(() => {
    try {
      return !localStorage.getItem("user");
    } catch {
      return true;
    }
  });
  const [bannerNotice, setBannerNotice] = useState(null);


  /* =========================
     PASSWORD STATE
  ========================= */

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordLoading, setPasswordLoading] =
    useState(false);

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  /* =========================
     CHANGE EMAIL MODAL STATE
  ========================= */
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailStep, setEmailStep] = useState(1); // 1 = details, 2 = otp
  const [newEmailInput, setNewEmailInput] = useState("");
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [showCurrentPasswordModal, setShowCurrentPasswordModal] = useState(false);
  const [emailOtpInput, setEmailOtpInput] = useState("");
  const [emailModalError, setEmailModalError] = useState("");
  const [emailModalNotice, setEmailModalNotice] = useState("");
  const [emailModalLoading, setEmailModalLoading] = useState(false);
  const [emailTimer, setEmailTimer] = useState(60);

  useEffect(() => {
    if (emailStep !== 2 || emailTimer <= 0) return;
    const interval = setInterval(() => setEmailTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [emailStep, emailTimer]);

  const handleOpenEmailModal = () => {
    setEmailModalOpen(true);
    setEmailStep(1);
    setNewEmailInput("");
    setCurrentPasswordInput("");
    setEmailOtpInput("");
    setEmailModalError("");
    setEmailModalNotice("");
  };

  const handleCloseEmailModal = () => {
    if (emailModalLoading) return;
    setEmailModalOpen(false);
    setEmailModalError("");
    setEmailModalNotice("");
  };

  const handleSendEmailOTP = async (e) => {
    e.preventDefault();
    setEmailModalError("");
    setEmailModalNotice("");

    const norm = newEmailInput.trim().toLowerCase();
    if (!norm) {
      setEmailModalError("Please enter your new email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(norm)) {
      setEmailModalError("Please enter a valid email address.");
      return;
    }
    if (formData.email && norm === formData.email.toLowerCase()) {
      setEmailModalError("This is already your current email address.");
      return;
    }
    if (!currentPasswordInput) {
      setEmailModalError("Current account password is required.");
      return;
    }

    try {
      setEmailModalLoading(true);
      const res = await sendEmailChangeOTP(norm, currentPasswordInput);
      setEmailStep(2);
      setEmailTimer(60);
      setEmailModalNotice(res?.data?.message || `Verification code sent to ${norm}`);
    } catch (err) {
      console.error("SEND EMAIL OTP ERROR:", err);
      setEmailModalError(
        err.response?.data?.message || "Failed to send verification code. Please check your password."
      );
    } finally {
      setEmailModalLoading(false);
    }
  };

  const handleVerifyEmailOTP = async (e) => {
    e.preventDefault();
    setEmailModalError("");
    setEmailModalNotice("");

    const code = emailOtpInput.trim();
    if (code.length !== 6) {
      setEmailModalError("Please enter the complete 6-digit verification code.");
      return;
    }

    try {
      setEmailModalLoading(true);
      const res = await verifyEmailChangeOTP(code);
      const updatedEmail = res?.data?.email || newEmailInput.trim().toLowerCase();
      setFormData((prev) => ({ ...prev, email: updatedEmail }));

      try {
        const cached = JSON.parse(localStorage.getItem("user") || "{}");
        cached.email = updatedEmail;
        localStorage.setItem("user", JSON.stringify(cached));
      } catch (err) {
        // ignore
      }

      alert("Email address updated successfully!");
      setEmailModalOpen(false);
    } catch (err) {
      console.error("VERIFY EMAIL OTP ERROR:", err);
      setEmailModalError(
        err.response?.data?.message || "Invalid or expired verification code."
      );
    } finally {
      setEmailModalLoading(false);
    }
  };

  const handleResendEmailOTP = async () => {
    if (emailTimer > 0 || emailModalLoading) return;
    setEmailModalError("");
    setEmailModalNotice("");
    try {
      setEmailModalLoading(true);
      const res = await sendEmailChangeOTP(newEmailInput.trim().toLowerCase(), currentPasswordInput);
      setEmailTimer(60);
      setEmailModalNotice(res?.data?.message || "Verification code resent.");
    } catch (err) {
      setEmailModalError(err.response?.data?.message || "Failed to resend code.");
    } finally {
      setEmailModalLoading(false);
    }
  };


  /* =========================
     GET PROFILE
  ========================= */

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");

      if (!token || token === "null" || token === "undefined") {
        navigate("/login");
        return;
      }

      try {
        const response = await getProfile();

        const user = response?.data?.user;

        if (user) {
          setFormData({
            fullName: user.fullName || "",
            email: user.email || "",
            phoneNumber: user.phoneNumber || "",
            dateOfBirth: user.dateOfBirth
              ? user.dateOfBirth.substring(0, 10)
              : "",
            gender: user.gender || "",
            address: {
              street: user.address?.street || "",
              city: user.address?.city || "",
              state: user.address?.state || "",
              pincode: user.address?.pincode || "",
            },
          });

          if (user.profileImage) {
            setProfileImage(
              getImageUrl(user.profileImage)
            );
          }

          localStorage.setItem("user", JSON.stringify(user));
        }
      } catch (error) {
        console.error(
          "GET PROFILE ERROR:",
          error
        );

        if (error?.response?.status === 401 || error?.response?.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }

        const cached = localStorage.getItem("user");
        if (!cached) {
          let errorMsg = "Unable to load profile from server. Please try again.";
          if (error?.code === "ERR_NETWORK" || error?.message === "Network Error") {
            errorMsg = "Unable to connect to the ELARQUE backend server (http://localhost:5000). Please ensure the backend server is running.";
          } else if (error?.response?.data?.message) {
            errorMsg = error.response.data.message;
          }

          setBannerNotice({
            type: "error",
            text: errorMsg,
          });
        }
      } finally {
        setPageLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);


  /* =========================
     PROFILE INPUT CHANGE
  ========================= */

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (
      name === "street" ||
      name === "city" ||
      name === "state" ||
      name === "pincode"
    ) {
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [name]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };


  /* =========================
     PASSWORD INPUT CHANGE
  ========================= */

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setPasswordErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };


  /* =========================
     PROFILE VALIDATION
  ========================= */

  const validateProfile = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName =
        "Full name is required";
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber =
        "Phone number is required";
    } else {
      const cleanPhone = formData.phoneNumber
        .replace(/\D/g, "")
        .slice(-10);

      if (cleanPhone.length !== 10) {
        newErrors.phoneNumber =
          "Enter a valid 10 digit phone number";
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };


  /* =========================
     SAVE PROFILE
  ========================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!validateProfile()) {
      return;
    }

    try {
      setLoading(true);
      setBannerNotice(null);

      const cleanPhone = formData.phoneNumber
        .replace(/\D/g, "")
        .slice(-10);

      const payload = {
        fullName: formData.fullName.trim(),
        phoneNumber: cleanPhone,
        dateOfBirth: formData.dateOfBirth || "",
        gender: formData.gender || "",
        address: formData.address,
      };

      const response = await updateProfile(payload);

      if (imageFile) {
        await updateProfileImage(imageFile);
      }

      const updatedUser = response?.data?.user;

      if (updatedUser) {
        localStorage.setItem(
          "user",
          JSON.stringify(updatedUser)
        );
        window.dispatchEvent(new Event("storage"));
      }

      setBannerNotice({
        type: "success",
        text: response?.data?.message || "Profile updated successfully.",
      });

      setTimeout(() => {
        navigate("/profile");
      }, 700);

    } catch (error) {
      console.error(
        "UPDATE PROFILE ERROR:",
        error
      );

      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        (error?.code === "ERR_NETWORK" || error?.message === "Network Error"
          ? "Unable to connect to the ELARQUE backend server (http://localhost:5000). Please ensure the backend server is running."
          : error?.message) ||
        "Unable to update profile. Please try again.";

      setBannerNotice({
        type: "error",
        text: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };


  /* =========================
     IMAGE CHANGE
  ========================= */

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert(
        "Image size must be less than 2MB"
      );
      return;
    }

    setImageFile(file);

    const previewUrl =
      URL.createObjectURL(file);

    setProfileImage(previewUrl);
  };


  /* =========================
     PASSWORD VALIDATION
  ========================= */

  const validatePassword = () => {
    const newErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword =
        "Current password is required";
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword =
        "New password is required";
    } else if (
      passwordData.newPassword.length < 8
    ) {
      newErrors.newPassword =
        "Password must contain at least 8 characters";
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword =
        "Please confirm your password";
    } else if (
      passwordData.newPassword !==
      passwordData.confirmPassword
    ) {
      newErrors.confirmPassword =
        "Passwords do not match";
    }

    setPasswordErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0
    );
  };


  /* =========================
     CHANGE PASSWORD
  ========================= */

  const handleChangePassword = async () => {
    if (!validatePassword()) {
      return;
    }

    try {
      setPasswordLoading(true);

      const response =
        await changePassword(
          passwordData
        );

      alert(
        response?.data?.message ||
          "Password changed successfully"
      );

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setPasswordErrors({});

    } catch (error) {
      console.error(
        "CHANGE PASSWORD ERROR:",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Unable to change password"
      );
    } finally {
      setPasswordLoading(false);
    }
  };


  /* =========================
     PAGE LOADING
  ========================= */

  if (pageLoading) {
    return (
      <>
        <style>{styles}</style>

        <div className="profile-page-loading">
          <div className="profile-loader"></div>

          <p>
            Loading profile...
          </p>
        </div>
      </>
    );
  }


  /* =========================
     MAIN PAGE
  ========================= */

  return (
    <>
      <style>{styles}</style>

      <div className="edit-profile-page">
        {/* =========================
            CONSISTENT CUSTOMER NAVBAR
        ========================= */}
        <Navbar />

        {/* =========================
            HEADER
        ========================= */}

        <div className="edit-profile-header">

          <button
            type="button"
            className="back-profile"
            onClick={() =>
              navigate("/profile")
            }
          >
            <ArrowLeft size={18} />

            Back to Profile
          </button>

          <h1>
            Edit Profile
          </h1>

          <p>
            Update your personal information
          </p>

        </div>


        {/* =========================
            MAIN FORM
        ========================= */}

        <form
          className="edit-card"
          onSubmit={handleSubmit}
        >
          {bannerNotice && (
            <div className={`profile-banner ${bannerNotice.type}`}>
              {bannerNotice.type === "success" ? (
                <CheckCircle2 size={18} />
              ) : (
                <X size={18} />
              )}
              <span>{bannerNotice.text}</span>
            </div>
          )}

          {/* PROFILE IMAGE */}

          <div className="profile-image-section">

            <div className="profile-image-wrapper">

              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="profile-image"
                />
              ) : (
                <div className="profile-image-placeholder">
                  <User size={45} />
                </div>
              )}

              <label
                htmlFor="profile-image"
                className="camera-button"
              >
                <Camera size={18} />

                <input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  onChange={
                    handleImageChange
                  }
                  hidden
                />
              </label>

            </div>

            <div className="image-text">

              <h3>
                Profile Photo
              </h3>

              <p>
                JPG, PNG or WEBP.
                Maximum size 2MB.
              </p>

            </div>

          </div>


          {/* =========================
              PERSONAL INFORMATION
          ========================= */}

          <div className="profile-section">

            <div className="section-heading">

              <User size={20} />

              <div>

                <h2>
                  Personal Information
                </h2>

                <p>
                  Keep your personal details
                  up to date
                </p>

              </div>

            </div>


            <div className="form-grid">

              {/* FULL NAME */}

              <div className="form-group">

                <label>
                  Full Name
                </label>

                <div
                  className={`input-wrapper ${
                    errors.fullName
                      ? "input-error"
                      : ""
                  }`}
                >

                  <User size={18} />

                  <input
                    type="text"
                    name="fullName"
                    value={
                      formData.fullName
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter your full name"
                  />

                </div>

                {errors.fullName && (
                  <span className="error-text">
                    {errors.fullName}
                  </span>
                )}

              </div>


              {/* EMAIL */}

              <div className="form-group">

                <div className="email-header-row">
                  <label>
                    Email Address
                  </label>

                  <button
                    type="button"
                    className="change-email-pill"
                    onClick={handleOpenEmailModal}
                  >
                    Change Email
                  </button>
                </div>

                <div className="input-wrapper disabled-input">

                  <Mail size={18} />

                  <input
                    type="email"
                    value={
                      formData.email
                    }
                    disabled
                  />

                </div>

                <small className="field-note">
                  To change your registered email, click Change Email (requires current password &amp; OTP).
                </small>

              </div>


              {/* PHONE */}

              <div className="form-group">

                <label>
                  Phone Number
                </label>

                <div
                  className={`input-wrapper ${
                    errors.phoneNumber
                      ? "input-error"
                      : ""
                  }`}
                >

                  <Phone size={18} />

                  <input
                    type="text"
                    name="phoneNumber"
                    value={
                      formData.phoneNumber
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter phone number"
                    maxLength={15}
                  />

                </div>

                {errors.phoneNumber && (
                  <span className="error-text">
                    {errors.phoneNumber}
                  </span>
                )}

              </div>


              {/* DATE OF BIRTH */}

              <div className="form-group">

                <label>
                  Date of Birth
                </label>

                <div className="input-wrapper">

                  <Calendar size={18} />

                  <input
                    type="date"
                    name="dateOfBirth"
                    value={
                      formData.dateOfBirth
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>


              {/* GENDER */}

              <div className="form-group">

                <label>
                  Gender
                </label>

                <div className="input-wrapper">

                  <User size={18} />

                  <select
                    name="gender"
                    value={
                      formData.gender
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="">
                      Select Gender
                    </option>

                    <option value="Female">
                      Female
                    </option>

                    <option value="Male">
                      Male
                    </option>

                    <option value="Other">
                      Other
                    </option>

                  </select>

                </div>

              </div>

            </div>

          </div>





          {/* =========================
              CHANGE PASSWORD
          ========================= */}

          <div className="profile-section password-section">

            <div className="section-heading">

              <Lock size={20} />

              <div>

                <h2>
                  Change Password
                </h2>

                <p>
                  Update your account password
                </p>

              </div>

            </div>


            <div className="password-form">

              {/* CURRENT PASSWORD */}

              <div className="form-group">

                <label>
                  Current Password
                </label>

                <div
                  className={`input-wrapper password-input ${
                    passwordErrors.currentPassword
                      ? "input-error"
                      : ""
                  }`}
                >

                  <Lock size={18} />

                  <input
                    type={
                      showCurrentPassword
                        ? "text"
                        : "password"
                    }
                    name="currentPassword"
                    value={
                      passwordData.currentPassword
                    }
                    onChange={
                      handlePasswordChange
                    }
                    placeholder="Enter current password"
                  />

                  <button
                    type="button"
                    className="password-eye"
                    onClick={() =>
                      setShowCurrentPassword(
                        !showCurrentPassword
                      )
                    }
                  >

                    {showCurrentPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}

                  </button>

                </div>

                {passwordErrors.currentPassword && (
                  <span className="error-text">
                    {
                      passwordErrors.currentPassword
                    }
                  </span>
                )}

              </div>


              {/* NEW PASSWORD */}

              <div className="form-group">

                <label>
                  New Password
                </label>

                <div
                  className={`input-wrapper password-input ${
                    passwordErrors.newPassword
                      ? "input-error"
                      : ""
                  }`}
                >

                  <Lock size={18} />

                  <input
                    type={
                      showNewPassword
                        ? "text"
                        : "password"
                    }
                    name="newPassword"
                    value={
                      passwordData.newPassword
                    }
                    onChange={
                      handlePasswordChange
                    }
                    placeholder="Enter new password"
                  />

                  <button
                    type="button"
                    className="password-eye"
                    onClick={() =>
                      setShowNewPassword(
                        !showNewPassword
                      )
                    }
                  >

                    {showNewPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}

                  </button>

                </div>

                {passwordErrors.newPassword && (
                  <span className="error-text">
                    {
                      passwordErrors.newPassword
                    }
                  </span>
                )}

                <small className="field-note">
                  Password must contain at
                  least 8 characters.
                </small>

              </div>


              {/* CONFIRM PASSWORD */}

              <div className="form-group">

                <label>
                  Confirm New Password
                </label>

                <div
                  className={`input-wrapper password-input ${
                    passwordErrors.confirmPassword
                      ? "input-error"
                      : ""
                  }`}
                >

                  <Lock size={18} />

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    name="confirmPassword"
                    value={
                      passwordData.confirmPassword
                    }
                    onChange={
                      handlePasswordChange
                    }
                    placeholder="Confirm new password"
                  />

                  <button
                    type="button"
                    className="password-eye"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                  >

                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}

                  </button>

                </div>

                {passwordErrors.confirmPassword && (
                  <span className="error-text">
                    {
                      passwordErrors.confirmPassword
                    }
                  </span>
                )}

              </div>


              {/* CHANGE PASSWORD */}

              <div className="change-password-action">

                <button
                  type="button"
                  className="change-password-btn"
                  onClick={
                    handleChangePassword
                  }
                  disabled={
                    passwordLoading
                  }
                >

                  <Lock size={17} />

                  {passwordLoading
                    ? "Changing..."
                    : "Change Password"}

                </button>

              </div>

            </div>

          </div>


          {/* =========================
              ACTION BUTTONS
          ========================= */}

          <div className="form-actions">

            <button
              type="button"
              className="cancel-btn"
              onClick={() =>
                navigate("/profile")
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-btn"
              disabled={loading}
            >

              <Save size={18} />

              {loading
                ? "Saving..."
                : "Save Changes"}

            </button>

          </div>

        </form>

        {/* =========================
            EMAIL CHANGE MODAL
        ========================= */}
        {emailModalOpen && (
          <div className="email-modal-backdrop" onClick={handleCloseEmailModal}>
            <div className="email-modal-card" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="email-modal-close"
                onClick={handleCloseEmailModal}
                aria-label="Close"
              >
                <X size={18} />
              </button>

              <div className="email-modal-icon-wrap">
                <Mail size={24} />
              </div>

              <p className="email-modal-eyebrow">SECURITY PRIVILEGE</p>

              {emailStep === 1 ? (
                <>
                  <h2 className="email-modal-title">Change Account Email</h2>
                  <p className="email-modal-desc">
                    To protect your account, enter your new email and verify your current password.
                  </p>

                  {emailModalError && (
                    <div className="email-modal-err">{emailModalError}</div>
                  )}

                  <form onSubmit={handleSendEmailOTP}>
                    <div className="email-modal-field">
                      <label>NEW EMAIL ADDRESS</label>
                      <div className="email-modal-input-box">
                        <Mail size={17} />
                        <input
                          type="email"
                          value={newEmailInput}
                          onChange={(e) => {
                            setNewEmailInput(e.target.value);
                            setEmailModalError("");
                          }}
                          placeholder="Enter your new email"
                          autoFocus
                          required
                        />
                      </div>
                    </div>

                    <div className="email-modal-field">
                      <label>CURRENT ACCOUNT PASSWORD</label>
                      <div className="email-modal-input-box">
                        <Lock size={17} />
                        <input
                          type={showCurrentPasswordModal ? "text" : "password"}
                          value={currentPasswordInput}
                          onChange={(e) => {
                            setCurrentPasswordInput(e.target.value);
                            setEmailModalError("");
                          }}
                          placeholder="Enter your current password"
                          required
                        />
                        <button
                          type="button"
                          className="modal-eye-btn"
                          onClick={() => setShowCurrentPasswordModal(!showCurrentPasswordModal)}
                        >
                          {showCurrentPasswordModal ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="email-modal-submit-btn"
                      disabled={emailModalLoading}
                    >
                      {emailModalLoading ? "SENDING VERIFICATION CODE…" : "SEND VERIFICATION CODE"}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <h2 className="email-modal-title">Verify New Email</h2>
                  <p className="email-modal-desc">
                    Enter the 6-digit confidential code sent to{" "}
                    <strong>{newEmailInput}</strong>.
                  </p>

                  {emailModalNotice && (
                    <div className="email-modal-notice">{emailModalNotice}</div>
                  )}
                  {emailModalError && (
                    <div className="email-modal-err">{emailModalError}</div>
                  )}

                  <form onSubmit={handleVerifyEmailOTP}>
                    <div className="email-modal-field">
                      <label>6-DIGIT VERIFICATION CODE</label>
                      <div className="email-modal-input-box">
                        <ShieldCheck size={17} />
                        <input
                          type="text"
                          maxLength={6}
                          value={emailOtpInput}
                          onChange={(e) => {
                            setEmailOtpInput(e.target.value.replace(/\D/g, ""));
                            setEmailModalError("");
                          }}
                          placeholder="000000"
                          style={{
                            letterSpacing: "6px",
                            fontSize: "18px",
                            fontWeight: "bold",
                            textAlign: "center",
                          }}
                          autoFocus
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="email-modal-submit-btn"
                      disabled={emailModalLoading}
                    >
                      {emailModalLoading ? "VERIFYING…" : "VERIFY & UPDATE EMAIL"}
                    </button>

                    <div
                      style={{
                        marginTop: "16px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <button
                        type="button"
                        className="email-modal-link-btn"
                        onClick={() => setEmailStep(1)}
                      >
                        ← Back to edit email
                      </button>
                      <button
                        type="button"
                        className="email-modal-link-btn"
                        onClick={handleResendEmailOTP}
                        disabled={emailTimer > 0 || emailModalLoading}
                      >
                        {emailTimer > 0 ? `Resend code in ${emailTimer}s` : "Resend code"}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </>
  );
};


/* =========================================================
   CSS
========================================================= */

const styles = `
  .profile-banner {
    padding: 14px 18px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 24px;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: all 0.3s ease;
  }
  .profile-banner.success {
    background: #eef7ee;
    border: 1px solid #c3e6cb;
    color: #1e6930;
  }
  .profile-banner.error {
    background: #fdf2f2;
    border: 1px solid #f5c6cb;
    color: #9c1c24;
  }
  .email-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  .change-email-pill {
    background: #650d20;
    color: #fff;
    border: none;
    border-radius: 14px;
    padding: 3px 12px;
    font-size: 11px;
    letter-spacing: 0.8px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  .change-email-pill:hover {
    background: #4a0910;
  }
  .email-modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(30, 8, 14, 0.65);
    backdrop-filter: blur(4px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  .email-modal-card {
    background: #fffdfb;
    border-radius: 24px;
    width: 100%;
    max-width: 480px;
    padding: 36px 32px 30px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.25);
    position: relative;
    text-align: center;
    border: 1px solid #ebdcd5;
  }
  .email-modal-close {
    position: absolute;
    top: 18px;
    right: 18px;
    background: #f7f0ea;
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #650d20;
  }
  .email-modal-icon-wrap {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: #650d20;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 14px;
  }
  .email-modal-eyebrow {
    font-size: 10px;
    letter-spacing: 2.5px;
    color: #8c6820;
    font-weight: 600;
    margin: 0 0 6px;
  }
  .email-modal-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 30px;
    color: #4a0f19;
    margin: 0 0 8px;
    font-weight: 600;
  }
  .email-modal-desc {
    font-size: 13px;
    color: #6d5b58;
    line-height: 1.5;
    margin: 0 0 22px;
  }
  .email-modal-field {
    text-align: left;
    margin-bottom: 18px;
  }
  .email-modal-field label {
    display: block;
    font-size: 11px;
    letter-spacing: 1.2px;
    font-weight: 600;
    color: #7d6b67;
    margin-bottom: 6px;
  }
  .email-modal-input-box {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #fff;
    border: 1px solid #d8ccc7;
    border-radius: 12px;
    padding: 0 14px;
    height: 48px;
    transition: border-color 0.2s;
  }
  .email-modal-input-box:focus-within {
    border-color: #650d20;
    box-shadow: 0 0 0 2px rgba(101, 13, 32, 0.1);
  }
  .email-modal-input-box input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: 14px;
    color: #2c1810;
  }
  .modal-eye-btn {
    background: none;
    border: none;
    color: #7d6b67;
    cursor: pointer;
    display: flex;
    align-items: center;
  }
  .email-modal-err {
    background: #fdeeed;
    color: #c0392b;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 12px;
    margin-bottom: 16px;
    text-align: left;
  }
  .email-modal-notice {
    background: #e8f5e9;
    color: #2e7d32;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 12px;
    margin-bottom: 16px;
    text-align: left;
  }
  .email-modal-submit-btn {
    width: 100%;
    height: 46px;
    background: #650d20;
    color: #fff;
    border: none;
    border-radius: 23px;
    font-size: 11px;
    letter-spacing: 1.5px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
    margin-top: 6px;
  }
  .email-modal-submit-btn:hover {
    background: #4a0910;
  }
  .email-modal-submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .email-modal-link-btn {
    background: none;
    border: none;
    font-size: 12px;
    color: #650d20;
    cursor: pointer;
    text-decoration: underline;
    padding: 0;
  }
  .email-modal-link-btn:disabled {
    color: #a0908c;
    cursor: not-allowed;
    text-decoration: none;
  }
  .edit-profile-page {
    min-height: 100vh;
    background: #faf6f1;
    padding: 40px 7%;
    color: #2d1b1f;
  }

  .edit-profile-header {
    max-width: 1100px;
    margin: 0 auto 30px;
  }

  .edit-profile-header h1 {
    margin: 20px 0 6px;
    font-family: "Cormorant Garamond", serif;
    font-size: 42px;
    font-weight: 600;
    color: #4a0f19;
  }

  .edit-profile-header p {
    margin: 0;
    color: #777;
    font-size: 14px;
  }

  .back-profile {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: none;
    background: transparent;
    color: #6b1f2a;
    cursor: pointer;
    font-size: 14px;
    padding: 0;
  }

  .edit-card {
    max-width: 1100px;
    margin: 0 auto;
    background: #ffffff;
    border: 1px solid #eadfd8;
    border-radius: 12px;
    padding: 35px;
    box-shadow: 0 10px 35px rgba(74, 15, 25, 0.06);
  }

  .profile-image-section {
    display: flex;
    align-items: center;
    gap: 25px;
    padding-bottom: 30px;
    border-bottom: 1px solid #eee5df;
  }

  .profile-image-wrapper {
    position: relative;
    width: 105px;
    height: 105px;
    flex-shrink: 0;
  }

  .profile-image,
  .profile-image-placeholder {
    width: 105px;
    height: 105px;
    border-radius: 50%;
  }

  .profile-image {
    object-fit: cover;
    border: 3px solid #c9a96e;
  }

  .profile-image-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f1e7e2;
    color: #6b1f2a;
  }

  .camera-button {
    position: absolute;
    right: -2px;
    bottom: 2px;
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #6b1f2a;
    color: white;
    cursor: pointer;
    border: 3px solid white;
  }

  .image-text h3 {
    margin: 0 0 5px;
    font-size: 18px;
    color: #4a0f19;
  }

  .image-text p {
    margin: 0;
    color: #888;
    font-size: 13px;
  }

  .profile-section {
    padding: 35px 0;
    border-bottom: 1px solid #eee5df;
  }

  .profile-section:last-of-type {
    border-bottom: none;
  }

  .section-heading {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 25px;
    color: #6b1f2a;
  }

  .section-heading svg {
    margin-top: 3px;
  }

  .section-heading h2 {
    margin: 0 0 5px;
    font-family: "Cormorant Garamond", serif;
    font-size: 25px;
    color: #4a0f19;
  }

  .section-heading p {
    margin: 0;
    color: #888;
    font-size: 13px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 22px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  .form-group.full-width {
    grid-column: 1 / -1;
  }

  .form-group label {
    margin-bottom: 8px;
    font-size: 13px;
    font-weight: 500;
    color: #4a0f19;
  }

  .input-wrapper {
    width: 100%;
    min-height: 48px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 14px;
    border: 1px solid #ddd1ca;
    border-radius: 6px;
    background: #fff;
    box-sizing: border-box;
    transition: 0.2s ease;
  }

  .input-wrapper svg {
    flex-shrink: 0;
    color: #8b6870;
  }

  .input-wrapper:focus-within {
    border-color: #6b1f2a;
    box-shadow: 0 0 0 2px rgba(107, 31, 42, 0.08);
  }

  .input-wrapper input,
  .input-wrapper select {
    flex: 1;
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
    font-family: "Poppins", sans-serif;
    font-size: 13px;
    color: #333;
  }

  .input-wrapper input::placeholder {
    color: #aaa;
  }

  .input-wrapper select {
    cursor: pointer;
  }

  .disabled-input {
    background: #f5f1ee;
    cursor: not-allowed;
  }

  .disabled-input input {
    color: #888;
    cursor: not-allowed;
  }

  .field-note {
    margin-top: 6px;
    font-size: 11px;
    color: #999;
  }

  .error-text {
    margin-top: 6px;
    color: #c62828;
    font-size: 12px;
  }

  .input-error {
    border-color: #c62828 !important;
  }

  .password-form {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 22px;
  }

  .password-input {
    position: relative;
  }

  .password-input input {
    padding-right: 38px;
  }

  .password-eye {
    position: absolute;
    right: 10px;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: #777;
    cursor: pointer;
  }

  .password-eye:hover {
    color: #6b1f2a;
  }

  .change-password-action {
    display: flex;
    align-items: flex-end;
  }

  .change-password-btn {
    min-height: 46px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 0 20px;
    border: 1px solid #6b1f2a;
    border-radius: 6px;
    background: #6b1f2a;
    color: white;
    font-family: "Poppins", sans-serif;
    font-size: 13px;
    cursor: pointer;
    transition: 0.2s ease;
  }

  .change-password-btn:hover {
    background: #4a0f19;
    border-color: #4a0f19;
  }

  .change-password-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 30px;
  }

  .cancel-btn,
  .save-btn {
    min-height: 45px;
    padding: 0 24px;
    border-radius: 6px;
    font-family: "Poppins", sans-serif;
    font-size: 13px;
    cursor: pointer;
    transition: 0.2s ease;
  }

  .cancel-btn {
    border: 1px solid #d8cbc5;
    background: white;
    color: #555;
  }

  .cancel-btn:hover {
    background: #f7f2ef;
  }

  .save-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: 1px solid #6b1f2a;
    background: #6b1f2a;
    color: white;
  }

  .save-btn:hover {
    background: #4a0f19;
  }

  .save-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .profile-page-loading {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #faf6f1;
    color: #6b1f2a;
  }

  .profile-loader {
    width: 35px;
    height: 35px;
    border: 3px solid #e5d8d2;
    border-top-color: #6b1f2a;
    border-radius: 50%;
    animation: profileLoader 0.8s linear infinite;
  }

  .profile-page-loading p {
    margin-top: 12px;
    font-size: 14px;
  }

  @keyframes profileLoader {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 850px) {
    .edit-profile-page {
      padding: 30px 4%;
    }

    .edit-card {
      padding: 25px;
    }

    .form-grid,
    .password-form {
      grid-template-columns: 1fr;
    }

    .form-group.full-width {
      grid-column: auto;
    }
  }

  @media (max-width: 600px) {
    .edit-profile-page {
      padding: 20px 15px;
    }

    .edit-profile-header h1 {
      font-size: 34px;
    }

    .edit-card {
      padding: 20px 16px;
    }

    .profile-image-section {
      flex-direction: column;
      align-items: flex-start;
    }

    .profile-section {
      padding: 25px 0;
    }

    .form-actions {
      flex-direction: column-reverse;
    }

    .cancel-btn,
    .save-btn {
      width: 100%;
    }

    .change-password-action {
      align-items: stretch;
    }

    .change-password-btn {
      width: 100%;
    }
  }
`;

export default EditProfile;
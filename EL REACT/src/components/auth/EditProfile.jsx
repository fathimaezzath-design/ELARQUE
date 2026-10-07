import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Lock,
  Camera,
  ArrowLeft,
  Save,
} from "lucide-react";

import {
  getProfile,
  updateProfile,
  updateProfileImage,
} from "../../services/profileService";


const EditProfile = () => {
  const navigate = useNavigate();

  /* =========================
     PROFILE STATE
  ========================= */

  const [formData, setFormData] = useState({
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
  });

  const [profileImage, setProfileImage] = useState("");
  const [imageFile, setImageFile] = useState(null);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);




  /* =========================
     IMAGE URL
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


  /* =========================
     GET PROFILE
  ========================= */

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setPageLoading(true);

        const response = await getProfile();

        const user = response?.data?.user;

        if (!user) {
          throw new Error("User data not found");
        }

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

        setProfileImage(
          getImageUrl(user.profileImage)
        );
      } catch (error) {
        console.error(
          "GET PROFILE ERROR:",
          error
        );

        alert(
          error?.response?.data?.message ||
            "Unable to load profile"
        );
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
        .replace(/\s|\+91/g, "")
        .trim();

      if (!/^[0-9]{10}$/.test(cleanPhone)) {
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

    if (!validateProfile()) {
      return;
    }

    try {
      setLoading(true);

      const cleanPhone = formData.phoneNumber
        .replace(/\s|\+91/g, "")
        .trim();

      const payload = {
        fullName: formData.fullName.trim(),

        phoneNumber: cleanPhone,

        dateOfBirth:
          formData.dateOfBirth || null,

        gender: formData.gender || "",

        address: {
          street:
            formData.address.street.trim(),

          city:
            formData.address.city.trim(),

          state:
            formData.address.state.trim(),

          pincode:
            formData.address.pincode.trim(),
        },
      };

      const response =
        await updateProfile(payload);

      let updatedUser =
        response?.data?.user;

      if (imageFile) {
        const imageResponse =
          await updateProfileImage(imageFile);

        const newProfileImage =
          imageResponse?.data?.profileImage;

        if (newProfileImage) {
          if (updatedUser) {
            updatedUser = {
              ...updatedUser,
              profileImage: newProfileImage,
            };
          } else {
            try {
              const existingLocalUser = JSON.parse(
                localStorage.getItem("user") || "{}"
              );
              updatedUser = {
                ...existingLocalUser,
                profileImage: newProfileImage,
              };
            } catch {
              updatedUser = { profileImage: newProfileImage };
            }
          }
        }
      }

      if (updatedUser) {
        localStorage.setItem(
          "user",
          JSON.stringify(updatedUser)
        );
      }

      alert(
        response?.data?.message ||
          "Profile updated successfully"
      );

      navigate("/profile");

    } catch (error) {
      console.error(
        "UPDATE PROFILE ERROR:",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Unable to update profile"
      );
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

                <div className="label-with-action">
                  <label>
                    Email Address
                  </label>

                  <button
                    type="button"
                    className="change-email-btn"
                    onClick={() => navigate("/edit-email")}
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
                  To update your email address, click Change Email above.
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
                    maxLength={13}
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
              SAVED ADDRESS
          ========================= */}

          <div className="profile-section">

            <div className="section-heading">

              <MapPin size={20} />

              <div>

                <h2>
                  Saved Address
                </h2>

                <p>
                  Manage your delivery and billing addresses
                </p>

              </div>

            </div>

            <div>
              <button
                type="button"
                className="manage-address-btn"
                onClick={() => navigate("/addresses")}
              >
                <MapPin size={16} />
                Manage Saved Address
              </button>
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

            <div>
              <button
                type="button"
                className="manage-address-btn"
                onClick={() => navigate("/change-password")}
              >
                <Lock size={16} />
                Change Password
              </button>
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

      </div>
    </>
  );
};


/* =========================================================
   CSS
========================================================= */

const styles = `
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

  .label-with-action {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .label-with-action label {
    margin-bottom: 0;
  }

  .change-email-btn {
    border: none;
    background: transparent;
    color: #6b1f2a;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    letter-spacing: 0.3px;
    text-decoration: underline;
    transition: color 0.2s ease;
  }

  .change-email-btn:hover {
    color: #4a0f19;
  }

  .error-text {
    margin-top: 6px;
    color: #c62828;
    font-size: 12px;
  }

  .input-error {
    border-color: #c62828 !important;
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

  .manage-address-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: #faf6f0;
    border: 1px solid #e8dfd5;
    border-radius: 8px;
    color: #520814;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    letter-spacing: 0.5px;
    transition: all 0.25s ease;
  }

  .manage-address-btn:hover {
    background: #520814;
    color: #faf6f0;
    border-color: #520814;
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

    .form-grid {
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
  }
`;

export default EditProfile;
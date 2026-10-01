await registerUser(formData);

navigate("/verify-otp", {
  state: {
    email: formData.email,
    phoneNumber: formData.phoneNumber,
    referralCode: formData.referralCode,
  },
});
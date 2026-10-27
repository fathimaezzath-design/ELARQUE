import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * PaymentSuccess — legacy route redirect.
 * All payment flows now navigate to /order-confirmed which shows the full
 * Salon Haute Couture order confirmation experience.
 */
function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();

  const stateData = location.state || {};
  const order = stateData.order;

  useEffect(() => {
    if (order) {
      // Redirect to the premium order confirmation page preserving state
      navigate("/order-confirmed", {
        state: { order },
        replace: true,
      });
    } else {
      // No order data — go home
      navigate("/", { replace: true });
    }
  }, [order, navigate]);

  return null;
}

export default PaymentSuccess;

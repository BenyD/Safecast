"use client";

import { Toaster as HotToaster } from "react-hot-toast";

const Toaster = () => {
  return (
    <HotToaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Default options for all toasts
        duration: 4000,
        style: {
          background: "#000000",
          color: "#ffffff",
          border: "1px solid #374151",
          borderRadius: "8px",
          padding: "12px 16px",
          fontSize: "14px",
          fontWeight: "500",
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        },
        // Success toast styling
        success: {
          style: {
            background: "#000000",
            color: "#ffffff",
            border: "1px solid #10b981",
          },
          iconTheme: {
            primary: "#10b981",
            secondary: "#ffffff",
          },
        },
        // Error toast styling
        error: {
          style: {
            background: "#000000",
            color: "#ffffff",
            border: "1px solid #ef4444",
          },
          iconTheme: {
            primary: "#ef4444",
            secondary: "#ffffff",
          },
        },
        // Loading toast styling
        loading: {
          style: {
            background: "#000000",
            color: "#ffffff",
            border: "1px solid #6b7280",
          },
        },
      }}
    />
  );
};

export { Toaster };

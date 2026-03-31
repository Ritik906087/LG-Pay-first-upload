document.addEventListener("DOMContentLoaded", () => {
    const spinner = document.getElementById("spinner");
    const qrImage = document.getElementById("qr-image");
    const statusText = document.getElementById("status-text");
    const paymentView = document.getElementById("payment-view");
    const successView = document.getElementById("success-view");
    const payerVpaEl = document.getElementById("payer-vpa");
    const paymentIdEl = document.getElementById("payment-id");
    const paymentTimeEl = document.getElementById("payment-time");
    
    let qrId = null;
    let pollingInterval = null;

    const API_BASE_URL = "/api";

    async function createQrCode() {
        try {
            const response = await fetch(`${API_BASE_URL}/create-qr`);
            if (!response.ok) {
                throw new Error("Failed to create QR code.");
            }
            const data = await response.json();
            
            qrId = data.qr_id;
            qrImage.src = data.image_url;
            
            qrImage.onload = () => {
                spinner.style.display = "none";
                qrImage.style.display = "block";
                statusText.textContent = "Waiting for payment...";
                startPolling();
            };

        } catch (error) {
            console.error("Error creating QR code:", error);
            statusText.textContent = "Error! Please refresh the page.";
            statusText.style.color = "#ef4444"; // Red color
        }
    }

    async function verifyPayment() {
        if (!qrId) return;

        try {
            const response = await fetch(`${API_BASE_URL}/verify-payment?qr_id=${qrId}`);
            if (!response.ok) {
                // Don't throw error, just log it. Polling will continue.
                console.error("Verification poll failed.");
                return;
            }
            const data = await response.json();

            if (data && data.paid) {
                stopPolling();
                showSuccess(data);
            }
        } catch (error) {
            console.error("Error verifying payment:", error);
        }
    }

    function startPolling() {
        if (pollingInterval) return;
        pollingInterval = setInterval(verifyPayment, 3000); // Poll every 3 seconds
    }

    function stopPolling() {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }
    }

    function showSuccess(paymentData) {
        paymentView.style.display = "none";
        
        payerVpaEl.textContent = paymentData.payer_vpa || "N/A";
        paymentIdEl.textContent = paymentData.razorpay_payment_id || "N/A";
        const paidDate = paymentData.paid_at ? new Date(paymentData.paid_at).toLocaleString() : "N/A";
        paymentTimeEl.textContent = paidDate;
        
        successView.style.display = "block";
        document.querySelector('.payment-details').style.display = 'block';
    }

    // Initial load
    createQrCode();
});

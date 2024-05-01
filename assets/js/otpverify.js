document.addEventListener("DOMContentLoaded", function() {
    const timer = document.getElementById("timer");
    const resendBtn = document.getElementById("resend");
    let timeLeft = 60;

    function startTimer() {
        let interval = setInterval(function() {
            if (timeLeft <= 0) {
                clearInterval(interval);
                resendBtn.disabled = false;
                timer.textContent = "";
            } else {
                timer.textContent = `Resend OTP in ${timeLeft} seconds`;
                timeLeft--;
            }
        }, 1000);
    }

    startTimer();

    resendBtn.addEventListener("click", function() {
        // Simulate OTP resend functionality
        timeLeft = 60;
        startTimer();
        this.disabled = true; // Disable resend button
    });
});

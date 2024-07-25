document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.getElementById('loginBox').classList.add('show');
    }, 5000);
});

document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent form submission

    const password = document.getElementById('password').value;
    const passwordPattern = /[a-zA-Z]+\d+/; // Pattern: some letters followed by a number
  
    if (!passwordPattern.test(password)) {
        alert('Password must contain some letters followed by a number.');
    } else {
        if (password === 'dhlhy25') {
            alert('YAYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY');
            window.location.href = './intro.html'; // Redirect to /gallery.html
        } else {
            alert('Wrong password');
        }
    }
});
const loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  // Send login request to the server
  fetch('/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(response => response.json())
    .then(data => {
      const token = data.token;

      // Store the token in local storage
      localStorage.setItem('token', token);

      // Redirect to the profile page
      window.location.href = '/profile';
    })
    .catch(error => console.error(error));
});
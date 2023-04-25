const loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await axios.post('http://localhost:3000/user/login', { email, password });

    // handle successful login
    alert('Login successful!');
  } catch (error) {
    // handle login error
    alert('Login failed!');
  }
});

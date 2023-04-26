const loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  console.log(email);

  try {
    const response = await axios.post('/user/login', { email, password });
    if (response.status === 200) {
      localStorage.setItem('token', response.data.token);
      alert('Login successful!');
    } 
    else {
      throw new Error('Failed to login');
    }
  } catch (error) {
    if (error.response.status === 401) {
      alert('Password incorrect');
    } else if (error.response.status === 404) {
      alert('User not found');
    } else {
      console.error(error);
      alert('Failed to login');
    }
  }
});
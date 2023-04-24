const form = document.getElementById('signup-form');
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  
  const name = form.elements.name.value;
  const email = form.elements.email.value;
  const phone = form.elements.phone.value;
  const password = form.elements.password.value;
  try {
    const response = await axios.post('/user/signup', {
      name,
      email,
      phone,
      password
    });
    alert('Registration successful!');
  } catch (error) {
    console.error(error);
    if (error.response.data.message === 'User already exists') {
      alert('User with this email already exists!');
    } else {
      alert('Error registering user');
  }
}
});
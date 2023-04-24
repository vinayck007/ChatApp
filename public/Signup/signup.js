const form = document.getElementById('signup-form');
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  
  const name = form.elements.name.value;
  const email = form.elements.email.value;
  const phone = form.elements.phone.value;
  const password = form.elements.password.value;
  console.log(name)
  try {
    const response = await axios.post('/user/signup', {
      name,
      email,
      phone,
      password
    });
    
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
});
const showSnackbar = () => {
  const x = document.querySelector('#snackbar');
  x.className = 'show';

  setTimeout(() => {
    x.className = '';
  }, 1000);
};

document.querySelector('#pre-json').addEventListener('click', e => {
  let text = '';

  if (window.getSelection().toString() !== '') {
    text = window.getSelection().toString();
  } else {
    text = e.target.innerText;
  }

  navigator.clipboard.writeText(text);

  showSnackbar();
});

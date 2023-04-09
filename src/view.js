const render = (path, value, watchedState, elements) => {
  const feedbackErrors = {
    url: 'Ссылка должна быть валидным URL',
    notOneOf: 'RSS уже существует',
  };

  const input = elements.form.querySelector('input');
  console.log(path)

  switch (path) {
    case 'form.error': {
      input.classList.add('is-invalid');
      elements.feedback.classList.add('text-danger');
      elements.feedback.classList.remove('text-success');
      elements.feedback.textContent = feedbackErrors[value];
      break;
    }
    case 'rssLinks': {
      input.classList.remove('is-invalid');
      elements.feedback.classList.remove('text-danger');
      elements.feedback.classList.add('text-success');
      elements.feedback.textContent = 'RSS успешно загружен';
      elements.form.reset();
      break;
    }
  }    
};

export default render;
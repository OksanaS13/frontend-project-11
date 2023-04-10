const render = (path, value, elements, i18nInstance) => {
  const input = elements.form.querySelector('input');

  switch (path) {
    case 'form.error': {
      input.classList.add('is-invalid');
      elements.feedback.classList.add('text-danger');
      elements.feedback.classList.remove('text-success');
      const text = document.createTextNode(value);
      elements.feedback.replaceChildren(text);
      break;
    }
    case 'rssLinks': {
      input.classList.remove('is-invalid');
      elements.feedback.classList.remove('text-danger');
      elements.feedback.classList.add('text-success');
      const text = document.createTextNode(i18nInstance.t('feedback.succes'));
      elements.feedback.replaceChildren(text);
      elements.form.reset();
      break;
    }
    default: {
      throw new Error('unknown path');
    }
  }
};

export default render;

import 'bootstrap';
import * as yup from 'yup';
import onChange from 'on-change';
import i18n from 'i18next';
import render from './view.js';
import ru from './locales/ru.js';

const validate = (url, addedUrls, i18nInstance) => {
  yup.setLocale({
    mixed: {
      notOneOf: () => i18nInstance.t('feedback.errors.existingRss'),
    },
    string: {
      url: () => i18nInstance.t('feedback.errors.invalidUrl'),
    },
  });
  const schema = yup.string().required().url().notOneOf(addedUrls);
  return schema.validate(url);
};

export default () => {
  const i18nInstance = i18n.createInstance();
  i18nInstance.init({
    lng: 'ru',
    debug: false,
    resources: {
      ru,
    },
  });

  // Model
  const initialState = {
    form: {
      status: 'filling',
      error: null,
    },
    rssLinks: [],
    posts: [],
    feeds: [],
  };

  const elements = {
    form: document.querySelector('.rss-form'),
    feedback: document.querySelector('.feedback'),
    posts: document.querySelector('.posts'),
    feeds: document.querySelector('.feeds'),
  };

  // View
  const watchedState = onChange(initialState, (path, value) => {
    render(path, value, elements, i18nInstance);
  });

  // Control
  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');
    validate(url.trim(), watchedState.rssLinks, i18nInstance)
      .then((data) => {
        watchedState.rssLinks.push(data);
      })
      .catch((data) => {
        watchedState.form.error = data.errors.join('');
      });
  });
};

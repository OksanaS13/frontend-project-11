import 'bootstrap';
import * as yup from 'yup';
import onChange from 'on-change';
import i18n from 'i18next';
import render from './view.js';
import ru from './locales/ru.js';
import parse from './utils/parse.js';

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

const getHtml = (url) => fetch(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`)
  .then((response) => {
    if (response.ok) return response.json();
    throw new Error('Network response was not ok.');
  });

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
  const watchedState = onChange(initialState, (path) => {
    render(path, watchedState, elements, i18nInstance);
  });

  // Control
  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url').trim();
    validate(url, watchedState.rssLinks, i18nInstance)
      .then((validUrl) => getHtml(validUrl))
      .catch((data) => {
        watchedState.form.error = data.errors.join('');
      })
      .then(({ contents }) => {
        const parser = new DOMParser();
        const xmlString = parser.parseFromString(contents, 'text/xml');
        const rss = parse(xmlString);
        if (!rss) {
          watchedState.form.error = i18nInstance.t('feedback.errors.noRss');
        }
        watchedState.feeds.push(rss.feed);
        watchedState.posts.unshift(...rss.posts);
        watchedState.rssLinks.push(url);
      });
  });
};

/* eslint-disable no-param-reassign */
import 'bootstrap';
import * as yup from 'yup';
import onChange from 'on-change';
import i18n from 'i18next';
import _ from 'lodash';
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

const actualize = (rssLinks, watchedState) => {
  if (rssLinks.length !== 0) {
    const requests = rssLinks.map((request) => getHtml(request)
      .then((data) => ({ status: 'succes', data: data.contents }))
      .catch((err) => ({ status: 'error', data: err })));
    const promise = Promise.all(requests);
    promise.then((responses) => responses.forEach((response) => {
      if (response.status === 'succes') {
        const { data } = response;
        const { posts, feed } = parse(data);
        if (feed && posts) {
          const [currentFeed] = watchedState.feeds.filter(({ title }) => feed.title === title);
          const feedId = currentFeed.id;
          const addedPostTitles = watchedState.posts.map((post) => post.postTitle);
          const newPosts = posts.filter(({ postTitle }) => !addedPostTitles.includes(postTitle));
          if (newPosts.length !== 0) {
            newPosts.forEach((post) => {
              post.feedId = feedId;
              post.postId = _.uniqueId();
            });
            watchedState.posts.unshift(...newPosts);
            watchedState.form.state = 'processed';
            watchedState.form.state = 'filling';
          }
        }
      }
      setTimeout(actualize, 5000, watchedState.rssLinks, watchedState);
    }));
  }
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

  const initialState = {
    form: {
      state: 'filling',
      error: null,
    },
    rssLinks: [],
    posts: [],
    feeds: [],
    uiState: {
      touchedPosts: [],
    },
  };

  const elements = {
    form: {
      container: document.querySelector('.rss-form'),
      input: document.getElementById('url-input'),
      button: document.querySelector('button[type=submit]'),
    },
    feedback: document.querySelector('.feedback'),
    posts: document.querySelector('.posts'),
    feeds: document.querySelector('.feeds'),
    modal: document.getElementById('modal'),
  };

  const watchedState = onChange(initialState, (path, value) => {
    render(path, value, watchedState, elements, i18nInstance);
  });

  elements.form.container.addEventListener('submit', (e) => {
    e.preventDefault();
    watchedState.form.state = 'sending';
    const formData = new FormData(e.target);
    const url = formData.get('url').trim();
    validate(url, watchedState.rssLinks, i18nInstance)
      .then((validUrl) => getHtml(validUrl))
      .catch((data) => {
        watchedState.form.error = data.errors.join('');
        watchedState.form.state = 'failed';
      })
      .then(({ contents }) => {
        const rss = parse(contents);
        if (!rss) {
          watchedState.form.error = i18nInstance.t('feedback.errors.noRss');
          watchedState.form.state = 'failed';
          return;
        }
        const feedId = _.uniqueId();
        rss.feed.id = feedId;
        rss.posts.forEach((post) => {
          post.feedId = feedId;
          post.postId = _.uniqueId();
        });

        watchedState.feeds.push(rss.feed);
        watchedState.posts.unshift(...rss.posts);
        watchedState.rssLinks.push(url);
        watchedState.form.state = 'processed';
        watchedState.form.state = 'filling';
        setTimeout(actualize, 5000, watchedState.rssLinks, watchedState);
      });
  });

  elements.modal.addEventListener('show.bs.modal', (e) => {
    const button = e.relatedTarget;
    const id = button.getAttribute('data-id');
    const [currentPost] = watchedState.posts.filter(({ postId }) => postId === id);
    watchedState.uiState.touchedPosts.push(currentPost);
    watchedState.form.state = 'show description';
    watchedState.form.state = 'touched post';
    watchedState.form.state = 'filling';
  });
};

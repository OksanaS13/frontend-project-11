/* eslint-disable no-param-reassign */
import 'bootstrap';
import * as yup from 'yup';
import onChange from 'on-change';
import i18n from 'i18next';
import axios from 'axios';
import _ from 'lodash';
import render from './view.js';
import ru from './locales/ru.js';
import parse from './utils/parse.js';

const validate = (url, urls, i18nInstance) => {
  yup.setLocale({
    mixed: {
      notOneOf: () => i18nInstance.t('feedback.errors.existingRss'),
    },
    string: {
      url: () => i18nInstance.t('feedback.errors.invalidUrl'),
    },
  });
  const schema = yup.string().required().url().notOneOf(urls);
  return schema.validate(url);
};

const getHtml = (link) => {
  const url = new URL('https://allorigins.hexlet.app/get?');

  url.searchParams.set('disableCache', 'true');
  url.searchParams.set('url', link);

  return axios.get(url.toString()).then((response) => response.data);
};

const normalizeUrl = (url) => (url.endsWith('/') ? url.slice(0, -1) : url);

const actualize = (watchedState, delay) => {
  const requests = watchedState.rssLinks.map((request) => getHtml(request)
    .then((data) => ({ status: 'succes', data: data.contents }))
    .catch((err) => ({ status: 'error', err })));
  const promise = Promise.all(requests);
  promise.then((responses) => responses.forEach((response) => {
    if (response.status === 'succes') {
      const { data } = response;
      const { posts, feed } = parse(data);
      if (feed && posts) {
        const currentFeed = watchedState.feeds.find(({ title }) => feed.title === title);
        const feedId = currentFeed.id;
        const addedPostTitles = watchedState.posts.map((post) => post.postTitle);
        const newPosts = posts.filter(({ postTitle }) => !addedPostTitles.includes(postTitle));
        if (newPosts.length !== 0) {
          const postsWithId = newPosts.map((post) => {
            post.feedId = feedId;
            post.postId = _.uniqueId();
            return post;
          });
          watchedState.posts.unshift(...postsWithId);
        }
      }
    }
  }));
  setTimeout(actualize, delay, watchedState, delay);
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
      state: null,
      feedback: null,
    },
    rssLinks: [],
    posts: [],
    feeds: [],
    uiState: {
      touchedPosts: [],
      modalPostId: null,
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
    render({ path, value }, watchedState, elements, i18nInstance);
  });

  elements.form.container.addEventListener('submit', (e) => {
    e.preventDefault();
    watchedState.form.state = 'sending';
    const formData = new FormData(e.target);
    const url = normalizeUrl(formData.get('url').trim());
    validate(url, watchedState.rssLinks, i18nInstance)
      .then((validUrl) => getHtml(validUrl))
      .catch((data) => {
        watchedState.form.feedback = data.errors.join('');
        watchedState.form.state = 'failed';
      })
      .then(({ contents }) => {
        const rss = parse(contents);
        if (!rss) {
          watchedState.form.feedback = i18nInstance.t('feedback.errors.noRss');
          watchedState.form.state = 'failed';
          return;
        }
        const feedId = _.uniqueId();
        rss.feed.id = feedId;
        const postsWithId = rss.posts.map((post) => {
          post.feedId = feedId;
          post.postId = _.uniqueId();
          return post;
        });

        watchedState.feeds.push(rss.feed);
        watchedState.posts.unshift(...postsWithId);
        watchedState.rssLinks.push(url);
        watchedState.form.feedback = i18nInstance.t('feedback.succes');
        watchedState.form.state = 'processed';
      })
      .catch(() => {
        watchedState.form.feedback = i18nInstance.t('feedback.errors.networkError');
        watchedState.form.state = 'failed';
      });
  });

  elements.modal.addEventListener('show.bs.modal', (e) => {
    const button = e.relatedTarget;
    const id = button.getAttribute('data-id');
    const currentPost = watchedState.posts.find(({ postId }) => postId === id);
    if (!watchedState.uiState.touchedPosts.includes(currentPost)) {
      watchedState.uiState.touchedPosts.push(currentPost);
    }
    watchedState.uiState.modalPostId = id;
  });

  const delay = 5000;
  setTimeout(actualize, delay, watchedState, delay);
};

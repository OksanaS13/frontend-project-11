/* eslint-disable no-param-reassign */
import * as yup from 'yup';
import onChange from 'on-change';
import i18n from 'i18next';
import axios from 'axios';
import _ from 'lodash';
import render from './view.js';
import ru from './locales/ru.js';
import parse from './parse.js';

const validate = (url, i18nInstance, urls = []) => {
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

const getUrl = (link) => {
  const url = new URL('https://allorigins.hexlet.app/get?');

  url.searchParams.set('disableCache', 'true');
  url.searchParams.set('url', link);
  return url;
};

const getHtml = (link) => {
  const url = getUrl(link);
  return axios.get(url.toString()).then((response) => response.data);
};

const normalizeUrl = (url) => (url.endsWith('/') ? url.slice(0, -1) : url);

const actualize = (watchedState, delay) => {
  const rssLinks = watchedState.feeds.map((feed) => feed.url);
  const requests = rssLinks.map((request) => getHtml(request)
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
        const addedPostTitles = watchedState.posts.map((post) => post.title);
        const newPosts = posts.filter(({ title }) => !addedPostTitles.includes(title));
        if (newPosts.length !== 0) {
          const postsWithId = newPosts.map((post) => {
            post.feedId = feedId;
            post.id = _.uniqueId();
            return post;
          });
          watchedState.posts.unshift(...postsWithId);
        }
      }
    } else {
      console.log(response.err);
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
      state: 'filling',
      feedback: null,
    },
    posts: [],
    feeds: [],
    uiState: {
      touchedPosts: [],
      modalPostId: null,
    },
  };

  const watchedState = onChange(initialState, (path, value) => {
    render({ path, value }, watchedState, i18nInstance);
  });

  document.querySelector('.rss-form').addEventListener('submit', (e) => {
    e.preventDefault();
    watchedState.form.state = 'sending';
    const formData = new FormData(e.target);
    const url = normalizeUrl(formData.get('url').trim());
    const rssLinks = watchedState.feeds.map((feed) => feed.url);
    validate(url, i18nInstance, rssLinks)
      .then((validUrl) => getHtml(validUrl))
      .catch((data) => {
        watchedState.form.feedback = data.errors.join('');
        watchedState.form.state = 'failed';
      })
      .then(({ contents }) => {
        let rss;
        try {
          rss = parse(contents);
        } catch {
          watchedState.form.feedback = i18nInstance.t('feedback.errors.noRss');
          watchedState.form.state = 'failed';
        }
        const feedId = _.uniqueId();
        rss.feed.id = feedId;
        rss.feed.url = url;
        const postsWithId = rss.posts.map((post) => {
          post.feedId = feedId;
          post.id = _.uniqueId();
          return post;
        });

        watchedState.feeds.push(rss.feed);
        watchedState.posts.unshift(...postsWithId);
        watchedState.form.feedback = i18nInstance.t('feedback.succes');
        watchedState.form.state = 'processed';
      })
      .catch(() => {
        watchedState.form.feedback = i18nInstance.t('feedback.errors.networkError');
        watchedState.form.state = 'failed';
      });

    watchedState.form.state = 'filling';
  });

  document.getElementById('modal').addEventListener('show.bs.modal', (e) => {
    const button = e.relatedTarget;
    const buttonId = button.getAttribute('data-id');
    const currentPost = watchedState.posts.find(({ id }) => id === buttonId);
    if (!watchedState.uiState.touchedPosts.includes(currentPost)) {
      watchedState.uiState.touchedPosts.push(currentPost);
    }
    watchedState.uiState.modalPostId = buttonId;
  });

  const delay = 5000;
  setTimeout(actualize, delay, watchedState, delay);
};

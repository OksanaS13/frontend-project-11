/* eslint-disable no-param-reassign */
import * as yup from 'yup';
import onChange from 'on-change';
import i18n from 'i18next';
import axios from 'axios';
import _ from 'lodash';
import render from './view.js';
import ru from './locales/ru.js';
import parse from './parse.js';

const validate = (url, urls = []) => {
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
  const requests = rssLinks.map((request) => getHtml(request));
  const promise = Promise.allSettled(requests);
  promise.then((responses) => responses.forEach((response) => {
    if (response.status === 'fulfilled') {
      const { value: data } = response;
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
      console.log(response.reason);
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

  yup.setLocale({
    mixed: {
      notOneOf: () => i18nInstance.t('feedback.errors.existingRss'),
    },
    string: {
      url: () => i18nInstance.t('feedback.errors.invalidUrl'),
    },
  });

  const initialState = {
    loadingProcess: {
      state: 'idle',
      error: null,
    },
    form: {
      state: 'filling',
      error: null,
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

  const form = document.querySelector('.rss-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    watchedState.form.state = 'sending';
    const formData = new FormData(e.target);

    const url = normalizeUrl(formData.get('url').trim());
    const rssLinks = watchedState.feeds.map((feed) => feed.url);
    validate(url, rssLinks)
      .then((validUrl) => getHtml(validUrl))
      .catch((data) => {
        watchedState.form.error = data.errors.join('');
        watchedState.form.state = 'failed';
        return { contents: 'no content' };
      })
      .then(({ contents }) => {
        if (contents === 'no content') {
          return;
        }
        let rss;
        try {
          rss = parse(contents);
        } catch {
          console.log('noRss');
          watchedState.form.error = i18nInstance.t('feedback.errors.noRss');
          watchedState.form.state = 'failed';
          return;
        }
        watchedState.loadingProcess.state = 'uploaded';
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
      })
      .catch(() => {
        watchedState.loadingProcess.error = i18nInstance.t('feedback.errors.networkError');
        watchedState.loadingProcess.state = 'failed';
      })
      .then(() => {
        watchedState.form.state = 'filling';
        watchedState.loadingProcess.state = 'idle';
      });
  });

  const modal = document.querySelector('#modal');
  modal.addEventListener('show.bs.modal', (e) => {
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

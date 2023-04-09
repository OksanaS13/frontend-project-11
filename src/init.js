import 'bootstrap';
import * as yup from 'yup';
import onChange from 'on-change';
import render from './view.js';

const validate = (url, addedUrls) => {
  const schema = yup.string().required().url().notOneOf(addedUrls);
  return schema.validate(url);
};

export default () => {
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
    console.log('поменялся watchedState')
    render(path, value, watchedState, elements);
  });

  // Control
  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('SUBMIT')
    const formData = new FormData(e.target);
    const url = formData.get('url');
    validate(url.trim(), watchedState.rssLinks)
      .then((data) => {
      console.log(data);
      watchedState.rssLinks.push(data)
    })
    .catch((data) => watchedState.form.error = data.type);
  });

};
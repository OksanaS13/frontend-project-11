import _ from 'lodash';

const createBlock = (type) => {
  const container = document.createElement('div');
  container.classList.add('card', 'border-0');

  const cardBody = document.createElement('div');
  cardBody.classList.add('card-body');

  const title = document.createElement('h2');
  title.classList.add('card-title', 'h4');
  title.textContent = type;

  const list = document.createElement('ul');
  list.classList.add('list-group', 'border-0', 'rounded-0');

  cardBody.append(title);
  container.append(cardBody, list);
  return container;
};

const addNewFeed = (feed) => {
  const item = document.createElement('li');
  item.classList.add('list-group-item', 'border-0', 'border-end-0');

  const itemTitle = document.createElement('h3');
  itemTitle.classList.add('h6', 'm-0');
  itemTitle.textContent = feed.title;

  const itemDescription = document.createElement('p');
  itemDescription.classList.add('m-0', 'small', 'text-black-50');
  itemDescription.textContent = feed.description;

  item.append(itemTitle, itemDescription);
  return item;
};

const addNewPosts = (posts) => posts.map((post) => {
  const item = document.createElement('li');
  item.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');

  const itemTitle = document.createElement('a');
  itemTitle.textContent = post.postTitle;
  itemTitle.classList.add('fw-bold');
  itemTitle.href = post.link;
  itemTitle.setAttribute('data-id', post.id);
  itemTitle.setAttribute('target', '_blank');
  itemTitle.setAttribute('rel', 'noopener noreferrer');

  const button = document.createElement('button');
  button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
  button.textContent = 'Просмотр';
  button.setAttribute('type', 'button');
  button.setAttribute('data-id', post.id);
  button.setAttribute('data-bs-toggle', 'modal');
  button.setAttribute('data-bs-target', '#modal');

  item.append(itemTitle, button);
  return item;
});

const render = (path, watchedState, elements, i18nInstance) => {
  const input = elements.form.querySelector('input');

  switch (path) {
    case 'form.error': {
      input.classList.add('is-invalid');
      elements.feedback.classList.add('text-danger');
      elements.feedback.classList.remove('text-success');
      const { error } = watchedState.form;
      const text = document.createTextNode(error);
      elements.feedback.replaceChildren(text);
      break;
    }
    case 'feeds': {
      if (watchedState.feeds.length === 1) {
        elements.feeds.append(createBlock('Фиды'));
      }
      const currentFeed = _.last(watchedState.feeds);
      const li = addNewFeed(currentFeed);
      elements.feeds.querySelector('ul').append(li);
      break;
    }
    case 'posts': {
      if (watchedState.feeds.length === 1) {
        elements.posts.append(createBlock('Посты'));
      }
      const list = addNewPosts(watchedState.posts);
      elements.posts.querySelector('ul').replaceChildren(...list);
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
      break;
    }
  }
};

export default render;

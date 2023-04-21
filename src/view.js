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

const addNewPosts = (posts, touchedPosts) => posts.map((post) => {
  const { postTitle, link, postId } = post;
  const touchedPostsId = touchedPosts.map((touchedPost) => touchedPost.postId);

  const item = document.createElement('li');
  item.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');

  const itemTitle = document.createElement('a');
  const button = document.createElement('button');

  item.append(itemTitle, button);
  if (touchedPostsId.includes(postId)) {
    itemTitle.outerHTML = `<a class="fw-normal" href="${link}" data-id="${postId}" target="_blank" rel="noopener noreferrer">${postTitle}</a>`;
  } else {
    itemTitle.outerHTML = `<a class="fw-bold" href="${link}" data-id="${postId}" target="_blank" rel="noopener noreferrer">${postTitle}</a>`;
  }
  button.outerHTML = `<button type="button" class="btn btn-outline-primary btn-sm" data-id="${postId}" data-bs-toggle="modal" data-bs-target="#modal">Просмотр</button>`;

  return item;
});

const render = (path, value, watchedState, elements, i18nInstance) => {
  switch (value) {
    case 'filling': {
      elements.form.input.removeAttribute('readonly');
      elements.form.button.removeAttribute('disabled');
      break;
    }
    case 'sending': {
      elements.form.input.setAttribute('readonly', 'true');
      elements.form.button.setAttribute('disabled', '');
      break;
    }
    case 'failed': {
      elements.form.input.classList.add('is-invalid');
      elements.feedback.classList.add('text-danger');
      elements.feedback.classList.remove('text-success');
      const { error } = watchedState.form;
      const text = document.createTextNode(error);
      elements.feedback.replaceChildren(text);

      elements.form.input.removeAttribute('readonly');
      elements.form.button.removeAttribute('disabled');
      break;
    }
    case 'processed': {
      elements.form.input.classList.remove('is-invalid');
      elements.feedback.classList.remove('text-danger');
      elements.feedback.classList.add('text-success');
      const text = document.createTextNode(i18nInstance.t('feedback.succes'));
      elements.feedback.replaceChildren(text);

      elements.feeds.replaceChildren(createBlock('Фиды'));
      const feeds = watchedState.feeds.map(addNewFeed);
      elements.feeds.querySelector('ul').append(...feeds);

      elements.posts.replaceChildren(createBlock('Посты'));
      const list = addNewPosts(watchedState.posts, watchedState.uiState.touchedPosts);
      elements.posts.querySelector('ul').replaceChildren(...list);

      elements.form.container.reset();
      break;
    }
    case 'show description': {
      elements.modal.classList.add('show');
      elements.modal.removeAttribute('aria-hidden');
      elements.modal.setAttribute('aria-modal', 'true');
      elements.modal.setAttribute('style', 'display: block;');

      const modalTitle = elements.modal.querySelector('.modal-title');
      const modalBody = elements.modal.querySelector('.modal-body');
      const modalLink = elements.modal.querySelector('.full-article');

      const { postTitle, postDescription, link } = _.last(watchedState.uiState.touchedPosts);

      modalTitle.textContent = postTitle;
      modalBody.textContent = postDescription;
      modalLink.href = link;
      break;
    }
    case 'touched post': {
      const { postId } = _.last(watchedState.uiState.touchedPosts);
      const currentPost = document.querySelector(`a[data-id="${postId}"]`);
      currentPost.classList.remove('fw-bold');
      currentPost.classList.add('fw-normal');
      break;
    }
    default: {
      break;
    }
  }
};

export default render;

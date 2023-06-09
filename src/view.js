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

const addNewPosts = (posts, touchedPosts, i18nInstance) => posts.map((post) => {
  const { title, link, id } = post;
  const touchedPostsId = touchedPosts.map((touchedPost) => touchedPost.id);

  const item = document.createElement('li');
  item.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');

  const itemTitle = document.createElement('a');
  const button = document.createElement('button');

  itemTitle.textContent = title;
  itemTitle.href = link;
  itemTitle.setAttribute('data-id', id);
  itemTitle.setAttribute('target', '_blank');
  itemTitle.setAttribute('rel', 'noopener noreferrer');

  if (touchedPostsId.includes(id)) {
    itemTitle.classList.add('fw-normal');
  } else {
    itemTitle.classList.add('fw-bold');
  }

  button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
  button.textContent = i18nInstance.t('buttons.viewPost');
  button.setAttribute('type', 'button');
  button.setAttribute('data-id', id);
  button.setAttribute('data-bs-toggle', 'modal');
  button.setAttribute('data-bs-target', '#modal');

  item.append(itemTitle, button);

  return item;
});

const render = (change, watchedState, i18nInstance) => {
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

  switch (change.value) {
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

      const mode = change.path.slice(0, -6);
      const { error } = watchedState[mode];
      const text = document.createTextNode(error);
      elements.feedback.replaceChildren(text);
      break;
    }
    case 'uploaded': {
      elements.form.input.classList.remove('is-invalid');
      elements.feedback.classList.remove('text-danger');
      elements.feedback.classList.add('text-success');
      const text = document.createTextNode(i18nInstance.t('feedback.succes'));
      elements.feedback.replaceChildren(text);
      break;
    }
    case 'idle': {
      elements.form.container.reset();
      break;
    }
    default: {
      break;
    }
  }

  switch (change.path) {
    case 'uiState.modalPostId': {
      const modalTitle = elements.modal.querySelector('.modal-title');
      const modalBody = elements.modal.querySelector('.modal-body');
      const modalLink = elements.modal.querySelector('.full-article');

      const { modalPostId } = watchedState.uiState;

      const {
        title, description, link, id,
      } = watchedState.uiState.touchedPosts.find((post) => post.id === modalPostId);
      const currentPost = document.querySelector(`a[data-id="${id}"]`);
      currentPost.classList.remove('fw-bold');
      currentPost.classList.add('fw-normal');

      modalTitle.textContent = title;
      modalBody.textContent = description;
      modalLink.href = link;
      break;
    }
    case 'feeds': {
      elements.feeds.replaceChildren(createBlock('Фиды'));
      const feeds = watchedState.feeds.map(addNewFeed);
      elements.feeds.querySelector('ul').append(...feeds);
      break;
    }
    case 'posts': {
      elements.posts.replaceChildren(createBlock('Посты'));
      const list = addNewPosts(watchedState.posts, watchedState.uiState.touchedPosts, i18nInstance);
      elements.posts.querySelector('ul').replaceChildren(...list);
      break;
    }
    default: {
      break;
    }
  }
};

export default render;

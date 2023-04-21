export default (contents) => {
  const parser = new DOMParser();
  const xmlString = parser.parseFromString(contents, 'text/xml');

  const title = xmlString.querySelector('title');
  const description = xmlString.querySelector('description');

  const articles = xmlString.querySelectorAll('item');
  if (articles.length === 0 || !title || !description) {
    return false;
  }

  const feed = {
    title: title.textContent,
    description: description.textContent,
  };

  const posts = [...xmlString.querySelectorAll('item')]
    .map((item) => {
      const postTitle = item.querySelector('title');
      const postDescription = item.querySelector('description');
      const link = item.querySelector('link');
      return {
        postTitle: postTitle.textContent,
        postDescription: postDescription.textContent,
        link: link.textContent,
      };
    });

  return { feed, posts };
};

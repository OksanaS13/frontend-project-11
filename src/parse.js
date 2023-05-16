class ErrorRss extends Error {
  constructor(message) {
    super(message);
    this.name = 'ErrorRss';
  }
}

export default (contents) => {
  const parser = new DOMParser();
  const xmlString = parser.parseFromString(contents, 'text/xml');
  const errorNode = xmlString.querySelector('parsererror');

  if (errorNode) {
    throw new ErrorRss(errorNode.textContent);
  } else {
    const title = xmlString.querySelector('title');
    const description = xmlString.querySelector('description');

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
          title: postTitle.textContent,
          description: postDescription.textContent,
          link: link.textContent,
        };
      });

    return { feed, posts };
  }
};

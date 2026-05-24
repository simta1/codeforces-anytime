import React from 'react';
import { Header } from 'semantic-ui-react';

const Contact = () => {
  return (
    <>
      <Header as="h2" content="Contact" subheader="Feedback is welcome." />
      <p>Please open an issue on GitHub for bugs, questions, or feedback.</p>
      <Header as="h3">
        <a href="https://github.com/simta1/codeforces-anytime">
          GitHub repository
        </a>
      </Header>
      <Header as="h3">
        <a href="https://github.com/simta1/codeforces-anytime/issues">
          GitHub issues
        </a>
      </Header>
    </>
  );
};

export default Contact;

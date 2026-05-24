import React, { useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import {
  Button,
  Header,
  Icon,
  List,
  Message,
  Modal,
  Segment,
} from 'semantic-ui-react';
import {
  fetchSelectedHandle,
  getSavedHandles,
  removeSavedProfileAPI,
  setActiveHandle,
} from '../api/userProfile';

const inlineCodeStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 6px',
  margin: '0 2px',
  border: '1px solid rgba(0, 0, 0, 0.15)',
  borderRadius: '4px',
  background: 'rgba(0, 0, 0, 0.06)',
  color: '#222',
  fontFamily: 'Menlo, Consolas, monospace',
  fontSize: '0.92em',
};

const StartPage: React.FC = () => {
  const history = useHistory();
  const [selectedHandle, setSelectedHandle] = useState('');
  const [savedHandles, setSavedHandles] = useState<string[]>([]);
  const [isHandleLoaded, setIsHandleLoaded] = useState(false);
  const [handleToRemove, setHandleToRemove] = useState('');

  useEffect(() => {
    fetchSelectedHandle().then((handle) => {
      setSelectedHandle(handle);
      setSavedHandles(getSavedHandles());
      setIsHandleLoaded(true);
    });
  }, []);

  return (
    <>
      <Header as="h2">
        <Header.Content>
          Anytime R<span style={{ color: 'red' }}>ated</span> in Codeforces
          contests!
        </Header.Content>
        <Header.Subheader>
          This local app plots rating changes using only your Codeforces virtual
          contests.
          <br />
          You can increase the rating at your own pace and at your own time.
        </Header.Subheader>
      </Header>
      <Header as="h3">How to use</Header>
      <List ordered={true}>
        <List.Item>
          Register with{' '}
          <a href="https://codeforces.com" target="blank">
            Codeforces
          </a>
        </List.Item>
        <List.Item>Set your Codeforces handle in this browser.</List.Item>
        <List.Item>
          Enter a{' '}
          <a href="https://codeforces.com" target="blank">
            Codeforces
          </a>{' '}
          virtual contest.
        </List.Item>
        <List.Item>Open your profile to update the local rating.</List.Item>
      </List>
      {!selectedHandle && isHandleLoaded ? (
        <Message
          warning={true}
          header="Codeforces handle is not configured"
          content="Set your handle from this page before opening the profile."
        />
      ) : null}
      {selectedHandle ? (
        <Message
          info={true}
          content={[
            'Current handle: ',
            <code key="handle" style={inlineCodeStyle}>
              {selectedHandle}
            </code>,
          ]}
        />
      ) : null}
      {savedHandles.length > 0 ? (
        <Segment>
          <Header as="h4" content="Saved handles" />
          <List divided={true} relaxed={true}>
            {savedHandles.map((savedHandle) => (
              <List.Item key={savedHandle}>
                <List.Content floated="right">
                  <Button
                    basic={true}
                    color="red"
                    icon={true}
                    title={`Remove ${savedHandle}`}
                    onClick={() => setHandleToRemove(savedHandle)}
                  >
                    <Icon name="trash alternate outline" />
                  </Button>
                </List.Content>
                <List.Content>
                  <Button
                    basic={true}
                    active={
                      savedHandle.toLowerCase() === selectedHandle.toLowerCase()
                    }
                    onClick={() => {
                      setActiveHandle(savedHandle);
                      setSelectedHandle(savedHandle);
                    }}
                  >
                    {savedHandle}
                  </Button>
                </List.Content>
              </List.Item>
            ))}
          </List>
        </Segment>
      ) : null}
      <Modal
        open={!!handleToRemove}
        onClose={() => setHandleToRemove('')}
        size="small"
      >
        <Modal.Header>Remove saved handle</Modal.Header>
        <Modal.Content>
          <p>
            Remove{' '}
            <code key="remove-handle" style={inlineCodeStyle}>
              {handleToRemove}
            </code>{' '}
            from this browser?
          </p>
          <Message
            warning={true}
            content="This deletes the locally saved profile and rating records for this handle. If you add it again later, the app will fetch and calculate everything from the beginning."
          />
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => setHandleToRemove('')}>Cancel</Button>
          <Button
            negative={true}
            onClick={() => {
              const result = removeSavedProfileAPI(handleToRemove);
              setSavedHandles(result.savedHandles);
              setSelectedHandle(result.activeHandle);
              setHandleToRemove('');
            }}
          >
            Remove
          </Button>
        </Modal.Actions>
      </Modal>
      <Button
        content="Go to profile"
        basic={true}
        color="green"
        disabled={!selectedHandle}
        onClick={() => {
          history.push(`/users/${selectedHandle}`);
        }}
      />
      <Button
        content="Add handle"
        basic={true}
        color="blue"
        onClick={() => {
          history.push('/profile/update');
        }}
      />
      <Segment>
        <Header as="h5" color="red">
          Note
        </Header>
        <List bulleted={true}>
          <List.Item>
            Contests held before June 2016 are not rated because they use a
            different rating algorithm from the one currently in use.
          </List.Item>
          <List.Item>
            Rating will be updated automatically when you visit the profile
            page. Data is stored in this browser's localStorage.
          </List.Item>
          <List.Item>
            It takes about 30 seconds to update rating per contest.
          </List.Item>
          <List.Item>
            If you have virtual contest history, the initial local rating is
            your official rating just before your first virtual contest.
            Otherwise, it starts at 1500.
          </List.Item>
          <List.Item>
            To be ranked, you have to join at least one virtual contest and
            update your rating.
          </List.Item>
        </List>
        <Header as="h5">
          Supported contests are <Link to="/contests">HERE</Link>!
        </Header>
      </Segment>
    </>
  );
};

export default StartPage;

import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { Button, Dimmer, Form, Header, Loader, Modal } from 'semantic-ui-react';
import { updateProfile } from '../actions';
import {
  createInitialProfile,
  fetchSelectedHandle,
  getSavedProfile,
  setActiveHandle,
} from '../api/userProfile';
import { useAccountInfo, useProfile } from '../hooks';
import UserProfile from '../types/userProfile';
import getRatingColorStyle from '../utils/getRatingColorStyle';

const UpdateProfilePage: React.FC = () => {
  const history = useHistory();

  const dispatch = useDispatch();
  const account = useAccountInfo();
  const profile = useProfile();
  const [handle, setHandle] = useState('');
  const [initialProfile, setInitialProfile] = useState<UserProfile | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [handleValidity, setHandleValidity] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  useEffect(() => {
    if (profile.handle) {
      setHandle(profile.handle);
      return;
    }
    fetchSelectedHandle().then((selectedHandle) => {
      setHandle(selectedHandle);
    });
  }, [profile.handle]);

  const onButtonClick = useCallback(async () => {
    const savedProfile = getSavedProfile(handle);
    if (savedProfile) {
      setActiveHandle(savedProfile.handle);
      history.push(`/users/${savedProfile.handle}`);
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Starting profile setup...');
    const nextProfile = await createInitialProfile(handle, setLoadingMessage)
      .then((createdProfile) => {
        setLoadingMessage('Done.');
        return createdProfile;
      })
      .catch(() => null);
    setIsLoading(false);
    setLoadingMessage('');
    if (!nextProfile) {
      setHandleValidity(false);
      return;
    }
    setHandleValidity(true);
    setInitialProfile(nextProfile);
    setModalOpen(true);
  }, [handle, history]);

  const onModalButtonClick = useCallback(() => {
    if (!initialProfile) {
      return;
    }
    dispatch(
      updateProfile(
        initialProfile.handle,
        initialProfile,
        () => {
          // setIsLoading(true);
        },
        () => {
          history.push(`/users/${initialProfile.handle}`);
        },
        () => {} // setIsLoading(false)
      )
    );
  }, [dispatch, history, initialProfile]);

  if (!account.ready) {
    return null;
  }

  return (
    <>
      <Header
        as="h2"
        content="Update Profile"
        subheader="Specify your Codeforces handle."
      />
      <Form>
        <Form.Input
          fluid={true}
          error={
            handleValidity
              ? false
              : { content: 'Invalid handle!', pointing: 'above' }
          }
          label="Handle"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
        />
        <Form.Button color="green" onClick={() => onButtonClick()}>
          OK
        </Form.Button>
        <Form.Button
          color="red"
          onClick={() => {
            if (profile.handle) {
              history.push(`/users/${profile.handle}`);
            } else {
              history.push('/');
            }
          }}
        >
          Cancel
        </Form.Button>
        <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
          <Modal.Header content="Use the following profile" />
          <Modal.Content>
            <Header as="h3" dividing={true}>
              Handle
            </Header>
            <Header
              as="h4"
              style={getRatingColorStyle(initialProfile?.rating || 1500)}
            >
              {initialProfile?.handle}
            </Header>
            <Header as="h3" dividing={true}>
              Initial rating
            </Header>
            <Header
              as="h4"
              style={getRatingColorStyle(initialProfile?.rating || 1500)}
            >
              {initialProfile?.rating}
            </Header>
            <p>{initialProfile?.initialRatingReason}</p>
          </Modal.Content>
          <Modal.Actions>
            <Header as="h5" color="red" floated="left">
              Existing records for this handle will be replaced.
            </Header>
            <Button color="green" onClick={onModalButtonClick}>
              OK
            </Button>
            <Button color="red" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
          </Modal.Actions>
        </Modal>
        <Dimmer active={isLoading} inverted={true}>
          <Loader active={true} inline="centered">
            {loadingMessage || 'Loading...'}
          </Loader>
        </Dimmer>
      </Form>
    </>
  );
};

export default UpdateProfilePage;

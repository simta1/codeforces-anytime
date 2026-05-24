import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { Button, Container, Divider, Menu, Segment } from 'semantic-ui-react';
import { changeAccountInfo } from '../actions';
import { getActiveHandle } from '../api/userProfile';
import { useAccountInfo } from '../hooks';

const PageWrapper: React.FC<{ children: any }> = ({ children }) => {
  const history = useHistory();
  const location = useLocation();

  const dispatch = useDispatch();
  const account = useAccountInfo();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  useEffect(() => {
    dispatch(changeAccountInfo({ ready: true }));
  }, [dispatch, history]);

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        flexDirection: 'column',
      }}
    >
      <Menu fixed="top" inverted={true} style={{ overflow: 'auto' }}>
        <Menu.Item
          header={true}
          onClick={() => {
            history.push('/');
          }}
        >
          Codeforces Anytime
        </Menu.Item>
        <Menu.Item
          onClick={() => {
            history.push('/contests');
          }}
        >
          Contests
        </Menu.Item>
        <Menu.Item
          onClick={() => {
            history.push('/ranking');
          }}
        >
          Ranking
        </Menu.Item>
        {(() => {
          if (account.ready) {
            return (
              <>
                <Menu.Item
                  position="right"
                  onClick={() => {
                    const handle = getActiveHandle();
                    history.push(handle ? `/users/${handle}` : '/');
                  }}
                >
                  Profile
                </Menu.Item>
                <Menu.Item
                  onClick={() => {
                    history.push('/profile/update');
                  }}
                >
                  Settings
                </Menu.Item>
              </>
            );
          } else {
            return null;
          }
        })()}
      </Menu>
      <Container text={true} style={{ marginTop: '6em', flex: 1 }}>
        {children}
      </Container>
      <div style={{ height: '5em' }} />
      <Segment inverted={true} vertical={true} style={{ padding: '2em 0em' }}>
        <Container textAlign="center">
          <Button
            basic={true}
            inverted={true}
            onClick={() => {
              history.push('/contact');
            }}
          >
            Contact Me
          </Button>
          <Divider inverted={true} />
          <p>Copyright © 2019 sono. All rights reserved.</p>
        </Container>
      </Segment>
    </div>
  );
};

export default PageWrapper;

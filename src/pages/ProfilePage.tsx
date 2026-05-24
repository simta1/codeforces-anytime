import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useHistory, useLocation, useParams } from 'react-router-dom';
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Button,
  Container,
  Dimmer,
  Grid,
  Header,
  Icon,
  Loader,
  Modal,
  Segment,
  Table,
} from 'semantic-ui-react';
import { fetchProfile, fetchUsers, updateContestRecords } from '../actions';
import RatingColoredName from '../components/RatingColoredName';
import {
  useAccountInfo,
  useIsUpdatingRating,
  useProfile,
  useUsers,
} from '../hooks';
import UserProfile from '../types/userProfile';
import { dateAndTimeStringFromSeconds } from '../utils/dateString';
import { monthStringFromTime } from '../utils/dateString';
import { getCertificate } from '../utils/getCertificate';
import getRatingColorStyle, {
  ratingColors,
} from '../utils/getRatingColorStyle';
import { getTwitterMessage } from '../utils/getTwitterMessage';
import { calculateTimeTick } from '../utils/graphUtilities';

const ProfilePage: React.FC = () => {
  const history = useHistory();
  const urlParams = useParams<{ id: string }>();
  const location = useLocation();

  const dispatch = useDispatch();
  const account = useAccountInfo();
  const users = useUsers();
  const profile = useProfile();
  const isUpdatingRating = useIsUpdatingRating();
  const isUpdatingRatingRef = useRef(isUpdatingRating);

  const [certIdx, setCertIdx] = useState(-1);
  const isActiveProfile =
    profile.handle.toLowerCase() === urlParams.id.toLowerCase();
  const matchingUserID = Object.keys(users).find(
    (id) => id.toLowerCase() === urlParams.id.toLowerCase()
  );

  useEffect(() => {
    isUpdatingRatingRef.current = isUpdatingRating;
  }, [isUpdatingRating]);

  useEffect(() => {
    const cert = new URLSearchParams(location.search).get('cert');
    if (cert) {
      setCertIdx(Number(cert));
    }
  }, [location.search]);

  useEffect(() => {
    if (!account.ready) {
      return;
    }

    dispatch(
      fetchProfile(
        () => {
          if (!isUpdatingRatingRef.current) {
            dispatch(updateContestRecords());
          }
        },
        () => {
          history.push('/profile/update');
        }
      )
    );
  }, [dispatch, account, history, urlParams.id]);

  useEffect(() => {
    if (!matchingUserID) {
      dispatch(
        fetchUsers(
          (currentUsers: { [id: string]: UserProfile }) => {
            const hasMatchingUser = Object.keys(currentUsers).some(
              (id) => id.toLowerCase() === urlParams.id.toLowerCase()
            );
            if (!hasMatchingUser) {
              history.push('/');
            }
          },
          () => {
            history.push('/');
          }
        )
      );
    }
  }, [dispatch, history, matchingUserID, urlParams.id]);

  if (!matchingUserID && !isActiveProfile) {
    return null;
  }

  let userInfo = matchingUserID ? users[matchingUserID] : profile;
  if (profile.records.length > 0 && isActiveProfile) {
    userInfo = profile;
  }

  let certificate = null;
  if (certIdx >= 0 && userInfo.records[userInfo.records.length - certIdx - 1]) {
    certificate = getCertificate(
      userInfo,
      userInfo.records.length - certIdx - 1
    );
  }

  const data = userInfo.records
    .map((record) => {
      return {
        name: record.contestName,
        time: record.startTime,
        rating: record.newRating,
      };
    })
    .reverse();

  const nameFromTime: { [time: number]: string } = {};
  userInfo.records.forEach((record) => {
    nameFromTime[record.startTime] = record.contestName;
  });

  const xTick = calculateTimeTick(
    data[0].time - 1000000,
    data[data.length - 1].time + 1000000
  );

  return (
    <>
      <Dimmer active={isUpdatingRating} inverted={true} page={true}>
        <Loader active={true} size="large">
          Loading virtual contest records...
        </Loader>
      </Dimmer>
      <Header as="h2">
        <RatingColoredName name={userInfo.handle} rating={userInfo.rating} />
        &nbsp;
        <a
          href={`https://codeforces.com/profile/${userInfo.handle}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'black', fontSize: '18px' }}
        >
          <Icon name="external alternate" />
        </a>
      </Header>
      {(() => {
        if (isActiveProfile) {
          return (
            <Link to="/profile/update">
              <Button
                basic={true}
                floated="right"
                content="User setting"
                color="green"
              />
            </Link>
          );
        }
      })()}
      <Header as="h4">
        Last Update:{dateAndTimeStringFromSeconds(userInfo.lastUpdateTime)}
      </Header>
      <ResponsiveContainer width="95%" height={300}>
        <ScatterChart
          margin={{
            top: 10,
            right: 20,
            bottom: 20,
            left: 10,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontalFill={ratingColors}
            fillOpacity={0.5}
            stroke="black"
          />
          <XAxis
            type="number"
            dataKey="time"
            name="date"
            domain={['dataMin - 1000000', 'dataMax + 1000000']}
            ticks={xTick}
            tickFormatter={(time) => monthStringFromTime(time)}
          />
          <YAxis
            type="number"
            dataKey="rating"
            domain={['dataMin-200', 'dataMax + 200']}
            ticks={[1200, 1400, 1600, 1900, 2100, 2400]}
            interval={0}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={(labels: any) => {
              if (labels.payload.length === 0) {
                return null;
              }
              const time: number = labels.payload[0].value;
              const rating: number = labels.payload[1].value;
              return (
                <Segment>
                  <Header as="h4" dividing={true}>
                    {nameFromTime[time]}
                  </Header>
                  <div>{dateAndTimeStringFromSeconds(time)}</div>
                  <div>
                    Rating:
                    <span style={getRatingColorStyle(rating)}>{rating}</span>
                  </div>
                </Segment>
              );
            }}
          />
          <Scatter name="A school" data={data} line={true} fill="white" />
        </ScatterChart>
      </ResponsiveContainer>
      <Table unstackable={true} celled={true}>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Date</Table.HeaderCell>
            <Table.HeaderCell>Contest</Table.HeaderCell>
            <Table.HeaderCell>Rank</Table.HeaderCell>
            <Table.HeaderCell>Perf.</Table.HeaderCell>
            <Table.HeaderCell>Rating</Table.HeaderCell>
            <Table.HeaderCell>Delta</Table.HeaderCell>
            <Table.HeaderCell>Cert.</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {userInfo.records.map((record, idx) => {
            const cert = getCertificate(userInfo, idx);

            return (
              <Table.Row key={record.startTime}>
                <Table.Cell>
                  {dateAndTimeStringFromSeconds(record.startTime)}
                </Table.Cell>
                <Table.Cell>
                  {record.contestID === 0 ? (
                    record.contestName
                  ) : (
                    <a
                      href={`https://codeforces.com/contest/${record.contestID}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {record.contestName}
                    </a>
                  )}
                </Table.Cell>
                <Table.Cell>{record.rank}</Table.Cell>
                <Table.Cell style={getRatingColorStyle(cert.performance)}>
                  {cert.performance}
                </Table.Cell>
                <Table.Cell style={getRatingColorStyle(record.newRating)}>
                  {record.newRating}
                </Table.Cell>
                <Table.Cell>{cert.deltaString}</Table.Cell>
                <Table.Cell>
                  <div
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setCertIdx(userInfo.records.length - idx - 1);
                    }}
                  >
                    <Icon name="file outline" />
                  </div>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>

      <Modal open={!!certificate} onClose={() => setCertIdx(-1)}>
        {certificate ? (
          <>
            <Modal.Header>
              <Icon name="certificate" color="yellow" />
              Contest Result
            </Modal.Header>
            <Modal.Content>
              <Container text={true}>
                <Grid style={{ fontWeight: 'bold' }}>
                  <Grid.Row>
                    <Grid.Column width={4}>User</Grid.Column>
                    <Grid.Column width={12}>
                      <span style={getRatingColorStyle(certificate.newRating)}>
                        {userInfo.handle}
                      </span>
                    </Grid.Column>
                  </Grid.Row>
                  <Grid.Row>
                    <Grid.Column width={4}>Contest</Grid.Column>
                    <Grid.Column width={12}>
                      {certificate.contestName}
                    </Grid.Column>
                  </Grid.Row>
                  <Grid.Row>
                    <Grid.Column width={4}>Rank</Grid.Column>
                    <Grid.Column>{certificate.rankString}</Grid.Column>
                  </Grid.Row>
                  <Grid.Row>
                    <Grid.Column width={4}>Performance</Grid.Column>
                    <Grid.Column>
                      <span
                        style={getRatingColorStyle(certificate.performance)}
                      >
                        {certificate.performance}
                      </span>
                    </Grid.Column>
                  </Grid.Row>
                  <Grid.Row>
                    <Grid.Column width={4}>Rating change</Grid.Column>
                    <Grid.Column width={12}>
                      <span style={getRatingColorStyle(certificate.oldRating)}>
                        {certificate.oldRating}
                      </span>
                      &nbsp;→&nbsp;
                      <span style={getRatingColorStyle(certificate.newRating)}>
                        {certificate.newRating}
                      </span>
                      &nbsp; ({certificate.deltaString}) &nbsp;
                      <span style={{ color: 'red' }}>
                        {certificate.isHighest ? 'Highest!' : ''}
                      </span>
                    </Grid.Column>
                  </Grid.Row>
                </Grid>
              </Container>
            </Modal.Content>
            <Modal.Actions>
              <Button
                color="twitter"
                circular={true}
                content="Tweet"
                icon="twitter"
                as="a"
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  getTwitterMessage(urlParams.id, certificate, certIdx)
                )}`}
                target="_blank"
              />
              <Button content="Close" onClick={() => setCertIdx(-1)} />
            </Modal.Actions>
          </>
        ) : null}
      </Modal>
      <script async={true} src="https://platform.twitter.com/widgets.js" />
    </>
  );
};

export default ProfilePage;

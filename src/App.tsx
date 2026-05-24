import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { HashRouter as Router, Route, useLocation } from 'react-router-dom';
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import PageWrapper from './components/PageWrapper';
import Contact from './pages/Contact';
import ContestsPage from './pages/ContestsPage';
import ProfilePage from './pages/ProfilePage';
import RankingPage from './pages/RankingPage';
import StartPage from './pages/StartPage';
import UpdateProfilePage from './pages/UpdateProfilePage';
import rootReducer from './reducers';

const store = createStore(rootReducer, applyMiddleware(thunk));

function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    document.title = `Codeforces Anytime${
      location.pathname === '/' ? '' : ` ${location.pathname}`
    }`;
  }, [location]);

  return null;
}

const App: React.FC = () => {
  return (
    <div>
      <Provider store={store}>
        <Router>
          <RouteTracker />
          <PageWrapper>
            <Route exact={true} path="/contests" component={ContestsPage} />
            <Route exact={true} path="/ranking" component={RankingPage} />
            <Route exact={true} path="/users/:id" component={ProfilePage} />
            <Route
              exact={true}
              path="/profile/update"
              component={UpdateProfilePage}
            />
            <Route exact={true} path="/contact" component={Contact} />
            <Route exact={true} path="/" component={StartPage} />
          </PageWrapper>
        </Router>
      </Provider>
    </div>
  );
};

export default App;

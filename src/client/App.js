import React, { Component } from 'react';
import axios from 'axios';

import './app.scss';

import LoginForm from './components/LoginForm';
import RegistrationForm from './components/RegistrationForm';
import {
    BrowserRouter as Router,
    Route,
    Redirect,
    Link,
    Switch
} from 'react-router-dom';
import Loadable from 'react-loadable';

const ProtectedArea = Loadable({
    loader: () => import('./components/ProtectedArea'),
    loading: () => ''
});

export default class App extends Component {
    constructor(props) {
        super(props);
        this.onSuccessfulLogin = this.onSuccessfulLogin.bind(this);
        this.onLogout = this.onLogout.bind(this);
        this.state = {
            initComplete: false,
            authenticated: false,
            username: ''
        };
    }
    componentDidMount() {
        axios.post('/api/checkLoggedIn').then(res => {
            if (res.data.success) {
                this.setState({
                    authenticated: true,
                    username: res.data.data.username
                });
            }
        }).finally(() => {
            this.setState({
                initComplete: true
            });
        });
    }
    onSuccessfulLogin(username) {
        this.setState({
            username,
            authenticated: true
        });
    }
    onLogout() {
        this.setState({
            authenticated: false
        });
    }
    render() {
        if (!this.state.initComplete) {
            return (
                <h1>Please wait...</h1>
            );
        }
        return (
            <Router>
                <Switch>
                    <Route path="/" exact={true} render={() => {
                        if (this.state.authenticated) {
                            return <ProtectedArea onLogout={this.onLogout} username={this.state.username}></ProtectedArea>
                        }
                        return <Redirect to={{pathname: "/login"}}/>
                    }} />
                    <Route path="/login" render={() => {
                        if (this.state.authenticated) {
                            return <Redirect to={{pathname: "/"}}/>
                        }
                        return <LoginForm onSuccessfulLogin={this.onSuccessfulLogin}></LoginForm>
                    }} />
                    <Route path="/register" render={() => {
                        if (this.state.authenticated) {
                            return <Redirect to={{pathname: "/"}}/>
                        }
                        return <RegistrationForm onSuccessfulRegistration={()=>null}></RegistrationForm>
                    }} />
                </Switch>
            </Router>
        );
    }
}
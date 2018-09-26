import React, { Component } from 'react';
import axios from 'axios';
import {Link} from 'react-router-dom';

class LoginForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            authenticationInProgress: false,
            authenticationFailed: false,
            successfulLogin: false,
            username: '',
            password: ''
        };
        this.login = this.login.bind(this);
        this.onUsernameChanged = this.onUsernameChanged.bind(this);
        this.onPasswordChanged = this.onPasswordChanged.bind(this);
    }
    login() {
        const username = this.state.username;
        const password = this.state.password;
        this.setState({
            authenticationInProgress: true
        });
        axios.post('/api/authenticate', {
            username,
            password
        }).then(res => {
            this.setState({
                successfulLogin: res.data.success === true,
                authenticationFailed: !res.data.success,
                authenticationInProgress: false
            }, () => {
                this.state.successfulLogin && this.props.onSuccessfulLogin(username);
            });
        }).catch(() => {
            this.setState({
                successfulLogin: false,
                authenticationFailed: true,
                authenticationInProgress: false
            });
        });
    }
    onUsernameChanged(e) {
        this.setState({
            username: e.target.value.trim()
        });
    }
    onPasswordChanged(e) {
        this.setState({
            password: e.target.value
        });
    }
    render() {
        return (
            <div className={this.state.authenticationInProgress ? "simple-form loading" : "simple-form"}>
                <div className="contents">
                    <h1>Sign In</h1>
                    <div className="form-section">
                        <label>What is your username?</label>
                        <input type="text" placeholder="Username" value={this.props.username} onChange={this.onUsernameChanged}/>
                        <span className="disclaimer">Enter Username specified during registration</span>
                    </div>
                    <div className="form-section">
                        <label>What is your password?</label>
                        <input type="password" placeholder="Password" value={this.props.password} onChange={this.onPasswordChanged}/>
                        <span className="disclaimer">Only you know the right one</span>
                    </div>
                    {this.state.authenticationFailed ? (
                        <p><span className="disclaimer error">Invalid Username or Password</span></p>
                    ) : (
                        <p><span className="disclaimer">&nbsp;</span></p>
                    )}
                    <button className="nice-button" onClick={this.login} disabled={this.state.username.length === 0 || this.state.password.length === 0}>Let me in</button>
                    <p><Link to="/register">Don't have an account yet?</Link></p>
                </div>
            </div>
        );
    }
}
export default LoginForm;
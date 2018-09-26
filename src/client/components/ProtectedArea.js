import React, { Component } from 'react';
import WelcomeAnimation from './welcome-animation/WelcomeAnimation';
import axios from 'axios';

class ProtectedArea extends Component {
    constructor(props) {
        super(props);
        this.logout = this.logout.bind(this);
    }
    logout() {
        axios.get('/api/deauthenticate');
        this.props.onLogout();
    }
    render() {
        return (
            <div className="protected-area">
                <h1>Protected area</h1>
                <button className="nice-button logout" onClick={this.logout}>Logout</button>
                <WelcomeAnimation text={this.props.username}></WelcomeAnimation>
            </div>
        );
    }
}
export default ProtectedArea;
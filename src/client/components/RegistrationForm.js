import React, { Component } from 'react';
import axios from 'axios';
import {Link} from 'react-router-dom';
import GenericResponse from '../../GenericResponse';

class RegistrationForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            registrationInProgress: false,
            successfulRegistration: false,
            fullname: '',
            username: '',
            password: '',
            createAccountButtonDisabled: true,
            unknownError: false,
            usernameOccupied: false,
            usernameError: false,
            passwordError: false
        };
        this.createAccount = this.createAccount.bind(this);
        this.onUserFullNameChanged = this.onUserFullNameChanged.bind(this);
        this.onUsernameChanged = this.onUsernameChanged.bind(this);
        this.onPasswordChanged = this.onPasswordChanged.bind(this);

        this.fullnameRef = React.createRef();
        this.usernameRef = React.createRef();
        this.passwordRef = React.createRef();
        this.checkUserTimer = null;
    }
    createAccount() {
        this.setState({
            registrationInProgress: true
        });
        axios.post('/api/register', {
            fullname: this.state.fullname,
            username: this.state.username,
            password: this.state.password
        }).then(res => {
            if (res.data.success) {
                this.setState({
                    successfulRegistration: true
                });
            } else {
                switch (res.data.reason) {
                    case GenericResponse.INVALID_USERNAME_OCCUPIED:
                        this.setState({
                            usernameOccupied: true
                        });
                        break;
                    case GenericResponse.INVALID_USERNAME:
                        this.setState({
                            usernameError: true
                        });
                        break;
                    case GenericResponse.INVALID_PASSWORD:
                        this.setState({
                            passwordError: true
                        });
                        break;
                    case GenericResponse.UNKNOWN_ERROR:
                    default:
                        this.setState({
                            unknownError: true
                        });
                        break;
                }
            }
            console.log(res.data);
        }).catch(() => {
            this.setState({
                unknownError: true
            });
        }).finally(() => {
            this.setState({
                registrationInProgress: false
            });
        });
    }
    performFormValidation(section) {
        const fullname = this.fullnameRef.current.value.trim();
        const username = this.usernameRef.current.value.trim();
        const password = this.passwordRef.current.value.trim();
        const createAccountButtonDisabled = username.length === 0 || password.length === 0 || this.state.usernameOccupied;

        this.setState({
            createAccountButtonDisabled,
            fullname,
        });
        switch (section) {
            case 'username':
                this.setState({
                    username: username,
                    usernameError: username.length === 0,
                });
                clearTimeout(this.checkUserTimer);
                this.checkUserTimer = setTimeout(() => {
                    const currentUsername = this.usernameRef.current.value.trim();
                    if (currentUsername.length) {
                        axios.post('/api/check-username', {username}).then((res) => {
                            if (res.data.success) {
                                this.setState({
                                    usernameOccupied: res.data.data.occupied
                                })
                            }
                        });
                    }
                }, 200);
                break;
            case 'password':
                this.setState({
                    password: password,
                    passwordError: password.length === 0
                });
                break;
        }
    }
    onUserFullNameChanged(e) {
        this.performFormValidation();
    }
    onUsernameChanged(e) {
        this.performFormValidation('username');
    }
    onPasswordChanged(e) {
        this.performFormValidation('password');
    }
    render() {
        const usernameDisclaimer = () => {
            if (this.state.usernameOccupied) {
                return <span className="disclaimer error">Username already taken</span>
            }
            if (this.state.usernameError) {
                return <span className="disclaimer error">Invalid username</span>
            }
            return <span className="disclaimer">Express yourself</span>
        }
        if (this.state.successfulRegistration) {
            return (
                <div className="simple-form">
                    <div className="contents">
                        <h1>Successful registration</h1>
                        <p>You can now <Link to="/login">Sign In</Link></p>
                    </div>
                </div>
            );
        }
        return (
            <div className={this.state.registrationInProgress ? "simple-form loading" : "simple-form"}>
                <div className="contents">
                    <h1>User registration</h1>
                    <div className="form-section">
                        <label>Hi, what's your name?</label>
                        <input type="text" placeholder="Your Full Name" onChange={this.onUserFullNameChanged} ref={this.fullnameRef}/>
                        <span className="disclaimer">But we don't mind if you leave this field blank</span>
                    </div>
                    <div className="form-section">
                        <label>What is your preferred username?</label>
                        <input type="text" placeholder="Desired Username" onChange={this.onUsernameChanged} ref={this.usernameRef}/>
                        {usernameDisclaimer()}
                    </div>
                    <div className="form-section">
                        <label>How about a password?</label>
                        <input type="password" placeholder="Your Password" onChange={this.onPasswordChanged} ref={this.passwordRef}/>
                        {this.state.passwordError ? (
                            <span className="disclaimer error">Invalid password</span>
                        ) : (
                            <span className="disclaimer">No restrictions, except it should not be empty</span>
                        )}
                    </div>
                    {this.state.unknownError ? (
                        <p><span className="disclaimer error">Unknown error</span></p>
                    ) : (
                        <p><span className="disclaimer">&nbsp;</span></p>
                    )}
                    <button className="nice-button" disabled={this.state.createAccountButtonDisabled} onClick={this.createAccount}>Create my account</button>
                    <p><Link to="/login">Already registered?</Link></p>
                </div>
            </div>
        );
    }
}
export default RegistrationForm;
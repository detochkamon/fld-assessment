import React, { useState, useEffect, useReducer } from 'react';
import axios from 'axios';
import {Link} from 'react-router-dom';

function LoginForm (props) {
    //use hooks approach for form inputs
    const [form, setFormValues] = useState({
        username: '',
        password: ''
    });
    //use Redux approach (but with React hooks) for form logic
    const [state, dispatch] = useReducer(reducer, {
        canLogin: false,
        authenticationInProgress: false,
        authenticationFailed: false,
        successfulLogin: false,
    });
    useEffect(() => {
        if (state.successfulLogin) {
            props.onSuccessfulLogin(form.username.trim());
        }
    }, [state.successfulLogin]);
    function reducer(state, action) {
        switch (action.type) {
            case 'form-change':
                return {
                    ...state,
                    canLogin: form.username.trim().length > 0 || form.password.length > 0
                }
            case 'authentication-success':
                return {
                    ...state,
                    successfulLogin: true,
                    authenticationFailed: false,
                    authenticationInProgress: false
                }
            case 'authentication-fail':
                return {
                    ...state,
                    successfulLogin: false,
                    authenticationFailed: true,
                    authenticationInProgress: false
                };
            case 'submit':
                state.canLogin && login();
                return {
                    ...state,
                    authenticationInProgress: state.canLogin
                };
            default:
                return state;
        }
    }
    function login() {
        axios.post('/api/authenticate', {
            username: form.username.trim(),
            password: form.password
        }).then(res => {
            dispatch({
                type: res.data.success ? 'authentication-success' : 'authentication-fail'
            })
        }).catch(() => {
            dispatch({
                type: 'authentication-fail'
            })
        });
    }
    function handleInputChange(e) {
        setFormValues({
            ...form,
            [e.target.name]: e.target.value
        });
        dispatch({
            type: 'form-change'
        });
    }
    return (
        <div className={state.authenticationInProgress ? "simple-form loading" : "simple-form"}>
            <div className="contents">
                <h1>Sign In</h1>
                <form onSubmit={(e) => { dispatch({type:'submit'}); e.preventDefault() }}>
                    <div className="form-section">
                        <label>What is your username?</label>
                        <input type="text" name="username" placeholder="Username" value={props.username} onChange={handleInputChange}/>
                        <span className="disclaimer">Enter Username specified during registration</span>
                    </div>
                    <div className="form-section">
                        <label>What is your password?</label>
                        <input type="password" name="password" placeholder="Password" value={props.password} onChange={handleInputChange}/>
                        <span className="disclaimer">Only you know the right one</span>
                    </div>
                    {state.authenticationFailed ? (
                        <p><span className="disclaimer error">Invalid Username or Password</span></p>
                    ) : (
                        <p><span className="disclaimer">&nbsp;</span></p>
                    )}
                    <button className="nice-button" type="submit" disabled={!state.canLogin}>Let me in</button>
                </form>
                <p><Link to="/register">Don't have an account yet?</Link></p>
            </div>
        </div>
    );
}
export default LoginForm;
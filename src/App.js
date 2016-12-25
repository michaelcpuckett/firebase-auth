import React, { Component } from 'react';
import './App.css';
import { createStore } from 'redux'
import { connect } from 'react-redux'
import * as firebase from 'firebase'
import config from './config.json'

const store = createStore((state, action) => {
    var newState
    switch (action.type) {
        case 'USERS_DB_UPDATE':
            newState = {
                user: action.data
            }
            return Object.assign({}, state, newState)
        default:
            return state
    }
}, {}, window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__())

const App = connect(state => ({
    user: state.user || {}
}))(class App extends Component {
    constructor() {
        super()
        this.state = {
            isLoggedIn: false,
            isLoading: true
        }
        firebase.initializeApp(config)
    }
    setUser (data) {
        store.dispatch({
            type: 'USERS_DB_UPDATE',
            data
        })
    }
    observeUserData (uid) {
        let usersRef = this.database.ref('users/' + uid)
        usersRef.on('value', (snapshot) => {
            this.setUser(Object.assign({}, this.props.user, snapshot.val()))
        })
    }
    componentWillMount() {
      var auth = firebase.auth()
      this.auth = auth

      var database = firebase.database()
      this.database = database

      auth.onAuthStateChanged(user => {
        if (user) {
            let {
                uid,
                displayName,
                photoURL,
                email,
                emailVerified
            } = user
            user = {
                uid,
                displayName,
                photoURL,
                email,
                emailVerified
            }
          this.setUser(user)
            this.observeUserData(user.uid)
            if (!user.emailVerified) {
                this.sendEmailVerification()
            }
            this.setState({
                isLoggedIn: true
            })
        }
        this.setState({
            isLoading: false
        })
      })
  }

    writeUserData(userId, data) {
        return this.database.ref('users/' + userId).set(data)
    }
    deleteAccount() {
         if (this.auth.currentUser) {
            let userId = this.auth.currentUser.uid

            this.database.ref('users/' + userId).set(null)
            this.auth.currentUser.delete().then(() => {
                this.signOut()
            })
        }
    }
  signInWithEmail() {
    var email = this.refs.email.value.trim()
    var password = this.refs.password.value
      this.auth.signInWithEmailAndPassword(email, password).catch(err => {
            alert(err.toString())
        })
  }
  signOut() {
      this.auth.signOut().then(() => {
          this.setState({
              isLoggedIn: false
          })
          this.setUser(null)
      })
  }
  signUpWithEmail() {
      var email = this.refs.email.value
      var password = this.refs.password.value
      this.auth.createUserWithEmailAndPassword(email, password).then(() => {
          alert('hello new user')
      }).catch(function(error) {
          alert(error.toString())
      })
  }
  updateProfile () {
      let authUser = this.auth.currentUser
      if (authUser) {
          let { uid, email, photoURL } = authUser
          let user = {
              uid,
              email,
              photoURL
          }
          let displayName = prompt("Name")
          let birthday = prompt("Birthday")
          Object.assign(user, {displayName, birthday})
          authUser.updateProfile({
              displayName
         }).catch(err => {
             alert(err.toString())
         })
         this.writeUserData(user.uid, user).catch(err => {
             alert(err.toString())
         })
      }
  }
  sendEmailVerification () {
      let user = this.auth.currentUser
      user.sendEmailVerification().catch(function(error) {
          alert(error.toString())
        });
  }
  render() {
    let user = this.props.user
    let { photoURL, displayName, uid, emailVerified } = user
    let { isLoading, isLoggedIn } = this.state

    return (
        <div className="App container">
            {isLoading ? (
                <div>Loading...</div>
            ) : (
                <div>
                    <div className="App-intro">
                        {isLoggedIn ? (
                            <div>
                                {emailVerified ? (
                                    <div>
                                        <div className="App-header">
                                            <img src={photoURL} className="App-logo" />
                                            <h2>
                                                Welcome, {displayName}
                                                <div>{JSON.stringify(user).split(',').join(', ')}</div>
                                            </h2>
                                        </div>
                                        <div>
                                          <button onClick={() => this.updateProfile()}>Update Profile</button>
                                          <br />
                                          <button onClick={() => this.signOut()}>Sign Out</button>
                                          <button onClick={() => this.deleteAccount()}>Delete Account</button>
                                        </div>
                                    </div>
                            ) : (
                                <div>
                                    <h2>Verify Email</h2>
                                    <button onClick={() => this.sendEmailVerification()}>Send E-mail Verification</button>
                                    <br />
                                    <button onClick={() => this.signOut()}>Sign Out</button>
                                </div>
                            )}
                            </div>
                        ) : (
                            <form action="#" onSubmit={function (e) {
                                e.preventDefault()
                                e.stopPropagation()
                            }}>
                              <label>
                                  Username <input type="text" ref="email"/>
                              </label>
                              <label>
                                  Password <input type="password" ref="password"/>
                              </label>
                              <button onClick={() => this.signInWithEmail()}>Sign In</button>
                              <button onClick={() => this.signUpWithEmail()}>Sign Up</button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
    }
})

export default class FullApp extends Component {
    render () {
        return (
            <App store={store} />
        )
    }
}

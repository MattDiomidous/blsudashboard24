import logo from './logo.svg';
import './App.css';
import {GoogleLogin} from 'react-google-login' 

function App() {
 
  const responseGoogle = response => {
    console.log(response)
  }
  
  const responseError = error => {
    console.log(error)
  }
 
  return (
    <div>
      <div className="App">
        <h1>Google Calendar API</h1>
      </div>

      <div> 
        <GoogleLogin

          clientId= '760416223091-rpt1uq9hc8qcrjdtuf6pamtnpslt8frp.apps.googleusercontent.com'
          buttonText = 'Sign in & Authorize Calendar'
          onSucess = {responseGoogle}
          onFailure = {responseError}
          cookiePolicy={'single_host_origin'}

          responseType = 'code'
          accessType = 'offline'
          scope = 'openid email profile https://www.googleapis.com/auth/calendar'

        />
      </div>
    </div>
  );
}

export default App;

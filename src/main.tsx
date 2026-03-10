import React from "react";
import ReactDOM from "react-dom/client";
import "./auth.css"
import App from "./App.tsx";
import { Amplify } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";
import outputs from "../amplify_outputs.json";
import '@aws-amplify/ui-react/styles.css';
import { datadogRum } from '@datadog/browser-rum';
import { reactPlugin } from '@datadog/browser-rum-react';


// RUM Monitoring Setup
datadogRum.init({
    applicationId: '468857ab-5f72-4e10-8e9d-3737ddeff831',
    clientToken: 'pub4722ee9cd2526282cbb772106d1e7eed',
    site: 'us3.datadoghq.com',
    service: 'sunsetters-frontend',
    env: 'prod',
    version: '0.8.0',
    sessionSampleRate: 100,
    sessionReplaySampleRate: 20,
    trackResources: true,
    trackUserInteractions: true,
    trackLongTasks: true,
    plugins: [reactPlugin({ router: false })],
});

datadogRum.startSessionReplayRecording();



Amplify.configure(outputs);

const formFields = {
  signUp: {
    given_name: {
      order: 1,
      placeholder: 'Enter Your Full Name Here',
      isRequired: true,
      label: 'Full Name'
    },

    email: {
      order: 2,
      placeholder: 'Enter Your Email Here',
      isRequired: true,
      label: 'Email'
    },

    password: {
      order: 5
    },
    confirm_password: {
      order: 6
    }
  }
}

const components = {
  Header() {
    return (
      <div className="auth-header-container">
        <h1 className="auth-logo-header">
          <span className="logo-sun">Sun</span>
          <span className="logo-setters">Setters</span>
        </h1>
      </div>
    );
  },
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <div className="app-container">
      <Authenticator formFields={formFields} components={components}>
        <App/>
      </Authenticator>
    </div>
  </React.StrictMode>
);

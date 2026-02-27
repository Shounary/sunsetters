import React from "react";
import ReactDOM from "react-dom/client";
import "./auth.css"
import App from "./App.tsx";
// import "./index.css";
import { Amplify } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";
import outputs from "../amplify_outputs.json";
import '@aws-amplify/ui-react/styles.css';

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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <div className="app-container">
      <Authenticator formFields={formFields}>
        <App/>
      </Authenticator>
    </div>
  </React.StrictMode>
);

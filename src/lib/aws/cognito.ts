/* eslint-disable operator-linebreak */
import {
  GetUserCommand,
  AdminInitiateAuthCommand,
  GlobalSignOutCommand,
  CognitoIdentityProviderClient,
  AdminInitiateAuthCommandOutput,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

// configure connection to Cognito
const cognitoIdentityServiceProvider = new CognitoIdentityProviderClient({
  region: import.meta.env.AWS_REGION,
  credentials: {
    accessKeyId: import.meta.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.AWS_SECRET_ACCESS_KEY,
  },
});

// login user

type LoginFunction = (username : string,password : string) => number;

interface Login {
    username: string;
    password: string;
  };
  
const login = ({ username, password }: Login): Promise<AdminInitiateAuthCommandOutput> => new Promise((resolve, reject) => {
  const params = {
    AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
    AuthParameters: { USERNAME: username, PASSWORD: password },
    UserPoolId: import.meta.env.AWS_COGNITO_USERPOOL_ID,
    ClientId: process.env.AWS_COGNITO_CLIENT_ID,
  };

  const command = new AdminInitiateAuthCommand(params);

  cognitoIdentityServiceProvider
    .send(command)
    .then(data => {
      resolve(data);
    })
    .catch((error) => {
      console.log('Login Error: ', { error });
      reject(error);
    });
});

const logout = (token:string) => new Promise((resolve, reject) => {
  const params = { AccessToken: token };
  const command = new GlobalSignOutCommand(params);

  cognitoIdentityServiceProvider
    .send(command)
    .then((data) => {
      resolve(data);
    })
    .catch((error) => {
      reject(error);
    });
});

const verifyToken = (token:string) => new Promise((resolve, reject) => {
  // Verifier that expects valid access tokens:

  const authProperties = {
    tokenUse: 'id' as const,
    userPoolId: import.meta.env.AWS_COGNITO_USERPOOL_ID,
    clientId: import.meta.env.AWS_COGNITO_CLIENT_ID,
  };

  const verifier = CognitoJwtVerifier.create(authProperties);
  verifier
    .verify(token,authProperties)
    .then((payload) => {
      resolve(payload);
    })
    .catch((err) => {
      reject(err);
    });
});

const refreshAuth = (RefreshToken:string) => new Promise<AdminInitiateAuthCommandOutput>((resolve, reject) => {
  const params = {
    AuthFlow: 'REFRESH_TOKEN_AUTH',
    AuthParameters: { REFRESH_TOKEN: RefreshToken },
    UserPoolId: import.meta.env.AWS_COGNITO_USERPOOL_ID,
    ClientId: import.meta.env.AWS_COGNITO_CLIENT_ID,
  };

  const command = new AdminInitiateAuthCommand(params);

  cognitoIdentityServiceProvider
    .send(command)
    .then((data) => {
      resolve(data);
    })
    .catch((error) => {
      reject(error);
    });
});

const getUser = (jwtToken:string) => new Promise((resolve, reject) => {
  const params = { AccessToken: jwtToken };

  const command = new GetUserCommand(params);
  cognitoIdentityServiceProvider
    .send(command)
    .then((data) => {
      resolve(data);
    })
    .catch((err) => {
      console.log('getCognitoUser failed', { err });
      reject(err);
    });
});

interface token {
  email:string;
  name:string;
  sub:string;
  'custom:role':string;
  'cognito:groups':string  
};

const buildUserFromIdToken = (decodedIdToken:token) => ({
  username: decodedIdToken.email,
  name: decodedIdToken.name,
  _id: decodedIdToken.sub,
  role: decodedIdToken['custom:role'],
  client: decodedIdToken['cognito:groups'],
});

export { login, logout, getUser, verifyToken, refreshAuth, buildUserFromIdToken };

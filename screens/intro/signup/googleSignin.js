import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';
import { Alert } from 'react-native';

if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

function base64UrlEncode(str) {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const generatePKCE = async () => {
  const randomBytes = new Uint8Array(32);
  Crypto.getRandomValues(randomBytes);
  const verifier = base64UrlEncode(Buffer.from(randomBytes).toString('base64'));
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  );
  const challenge = base64UrlEncode(hash);
  return { verifier, challenge };
};

const discovery = {
  authorizationEndpoint: 'https://us-east-1satk1s7rf.auth.us-east-1.amazoncognito.com/oauth2/authorize',
  tokenEndpoint: 'https://us-east-1satk1s7rf.auth.us-east-1.amazoncognito.com/oauth2/token',
};

const cognitoConfig = {
  clientId: '15iaae67g5l5ri9allt7f866',
  redirectUri: AuthSession.makeRedirectUri({
    useProxy: true,
    scheme: 'qiimeet'
  }),
  responseType: 'code',
  scopes: ['openid', 'email', 'phone'],
  additionalParameters: {
    identity_provider: 'Google',
  },
  usePKCE: true,
};

export const loginWithGoogle = async (navigation) => {
  try {
    const redirectUri = AuthSession.makeRedirectUri({
      useProxy: true,
    });
    const { verifier, challenge } = await generatePKCE();
    await AsyncStorage.setItem('codeVerifier', verifier);
    const request = new AuthSession.AuthRequest({
      clientId: cognitoConfig.clientId,
      scopes: cognitoConfig.scopes,
      redirectUri: redirectUri,
      responseType: AuthSession.ResponseType.Code,
      extraParams: {
        ...cognitoConfig.additionalParameters,
        code_challenge: challenge,
        code_challenge_method: 'S256',
      },
    });
    const result = await request.promptAsync(discovery);
    if (result.type === 'success' && result.params.code) {
      const tokenResponse = await exchangeCodeForTokens(result.params.code, verifier);
      if (tokenResponse.access_token) {
        await AsyncStorage.setItem('accessToken', tokenResponse.access_token);
        await AsyncStorage.setItem('idToken', tokenResponse.id_token);
        await AsyncStorage.setItem('refreshToken', tokenResponse.refresh_token);
        navigation.navigate('Welcome');
      }
    } else {
      Alert.alert('Login Failed', 'Google authentication was cancelled or failed');
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to authenticate with Google');
  }
};

const exchangeCodeForTokens = async (code, codeVerifier) => {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: cognitoConfig.clientId,
    code: code,
    redirect_uri: cognitoConfig.redirectUri,
    code_verifier: codeVerifier,
  });
  const response = await fetch(discovery.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const tokenData = await response.json();
  if (!response.ok) throw new Error(tokenData.error_description || 'Token exchange failed');
  return tokenData;
};

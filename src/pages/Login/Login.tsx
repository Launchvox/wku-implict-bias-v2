import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Button from '@/components/Button';
import Input from '@/components/Input/Input';
import { LoginBody } from '@/types/auth';
import { loginSchema } from '@/lib/validation';
//import { useLoginQuery } from '@/services/queries/auth.query';
//import useAuthStore from '@/store/useAuthStore';
//import { toast } from 'react-toastify';
import { useState, useEffect, useMemo } from 'react';
import {Auth} from '@aws-amplify/auth';
import { CognitoHostedUIIdentityProvider } from '@aws-amplify/auth/lib/types';

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginBody>({ resolver: yupResolver(loginSchema) });



  const [state, setState] = useState({
    user: {'id':'none'},
    isSignedIn: false
  });

  //Use "Memorized", i.e. cached authentication 
  const auth = useMemo(() => {
    return Auth;
  }, []);

  useEffect(() => {
    auth.currentAuthenticatedUser()
      .then((user) => setState({ user, isSignedIn: true }))
      .catch(() => {console.log('Error in current Authenticated User');});
  }, []);

  const provider = CognitoHostedUIIdentityProvider.Cognito;

  const signIn = async () => {
    await auth.federatedSignIn({ provider });
    /*  The useEffect should handle the new user auth, no need to capture it manually.  
      .then((credentials) => setState({ 
        user:credentials.identityId, isSignedIn: credentials.authenticated 
      }));*/
  };

  //const signOut = () => auth.signOut();

  //const { setIsAuthenticated } = useAuthStore((state) => state);
  //const { isLoading, mutateAsync: login, isError, error } = useLoginQuery();

  /*
  useEffect(() => {
    if (isError) {
      toast.error(error as string, { theme: 'colored' });
    }
  }, [isError]);
  */

  const onSubmit: SubmitHandler<LoginBody> = async () => {
    await signIn();
  };

  return (
    <form
      className="m-auto w-[90%] md:w-[30%]"
      onSubmit={handleSubmit(onSubmit)}
    >
      <p className="text-center text-sm mb-2">Username: user</p>
      <p className="text-center text-sm mb-3">Password: user</p>
      <Input
        errors={errors}
        placeholder="Username"
        label="Username"
        id="username"
        register={register}
        name="username"
      />
      <Input
        errors={errors}
        placeholder="Password"
        label="Password"
        type="password"
        register={register}
        name="password"
      />
      <Button text="Login" type="submit" /*isLoading={isLoading}*/ />
    </form>
  );
};

export default Login;

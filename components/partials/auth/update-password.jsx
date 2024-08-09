'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseclient';
import { toast } from 'react-toastify';
import Textinput from '@/components/ui/Textinput';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup
  .object({
    password: yup.string().required('Password is required'),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref('password'), null], 'Passwords must match')
      .required('Confirm Password is required'),
  })
  .required();

const UpdatePassword = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [accessToken, setAccessToken] = useState(null);
  const [type, setType] = useState(null);

  useEffect(() => {
    if (router.isReady) {
      const { token, type, error } = router.query;
      if (error) {
        toast.error('Email link is invalid or has expired', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: 'light',
        });
        router.push('/forgot-password');
      } else if (token && type === 'recovery') {
        setAccessToken(token);
        setType(type);
      } else {
        toast.error('Invalid or missing access token', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: 'light',
        });
        router.push('/forgot-password');
      }
    }
  }, [router.isReady, router.query, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async ({ password }) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password,
        token: accessToken,
      });
      if (error) {
        throw error;
      }
      toast.success('Password updated successfully!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light',
      });
      router.push('/');
    } catch (error) {
      toast.error(error.message, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
      <Textinput
        name='password'
        label='New Password'
        type='password'
        placeholder='Enter your new password'
        register={register}
        error={errors.password}
      />
      <Textinput
        name='confirmPassword'
        label='Confirm Password'
        type='password'
        placeholder='Confirm your new password'
        register={register}
        error={errors.confirmPassword}
      />
      <button
        type='submit'
        className='btn btn-dark block w-full text-center'
        disabled={loading}
      >
        {loading ? 'Updating...' : 'Update Password'}
      </button>
    </form>
  );
};

export default UpdatePassword;

'use client';

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Textinput from '@/components/ui/Textinput';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseclient'; // Import Supabase client
import Dropdowntype from '@/components/ui/Dropdown1';

const schema = yup
  .object({
    name: yup.string().required('Name is Required'),
    email: yup.string().email('Invalid email').required('Email is Required'),
    mobile: yup
      .string()
      .required('Mobile number is Required')
      .matches(/^[0-9]+$/, 'Mobile number must be numeric'),
    password: yup
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(20, "Password shouldn't be more than 20 characters")
      .required('Please enter password'),
    confirmpassword: yup
      .string()
      .oneOf([yup.ref('password'), null], 'Passwords must match'),
    user_type: yup.string().required('User type is required'),
  })
  .required();

const RegForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userType, setUserType] = useState('Select User Type');
  const {
    register,
    formState: { errors },
    handleSubmit,
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'all',
  });

  const router = useRouter();

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email: data.email,
        password: data.password,
      }
    );

    if (signUpError) {
      toast.error(signUpError.message);
      setIsSubmitting(false);
      return;
    }

    if (signUpData?.user) {
      const userId = signUpData.user.id;

      // Update the user's profile with additional details
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          display_name: data.name, // Adding display name to the user's metadata
        },
      });

      if (updateError) {
        toast.error(updateError.message);
        setIsSubmitting(false);
        return;
      }

      // Determine the default role for the user
      let userRole = 'user'; // Default role
      if (data.user_type === 'investor') {
        userRole = 'investor';
      } else if (data.user_type === 'startup') {
        userRole = 'startup';
      }

      // Optionally, make the first registered user a super admin
      const { data: allUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*');

      if (!usersError && allUsers.length === 0) {
        userRole = 'super_admin';
      }

      // Insert additional user data into the profiles table
      const { error: insertError } = await supabase.from('profiles').insert([
        {
          id: userId,
          name: data.name,
          email: data.email,
          mobile: data.mobile,
          user_type: data.user_type,
          role: userRole, // Set the user role
        },
      ]);

      if (insertError) {
        toast.error(insertError.message);
        setIsSubmitting(false);
      } else {
        toast.success('Account created successfully!');
        router.push('/'); // Redirect to login page after registration
      }
    }
  };

  const handleSelectUserType = (value) => {
    setUserType(value.charAt(0).toUpperCase() + value.slice(1));
    setValue('user_type', value);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
      <Textinput
        name='name'
        label='Name'
        type='text'
        placeholder='Enter your name'
        register={register}
        error={errors.name}
      />
      <Textinput
        name='email'
        label='Email'
        type='email'
        placeholder='Enter your email'
        register={register}
        error={errors.email}
      />
      <Textinput
        name='mobile'
        label='Mobile'
        type='text'
        placeholder='Enter your mobile number'
        register={register}
        error={errors.mobile}
      />
      <Textinput
        name='password'
        label='Password'
        type='password'
        placeholder='Enter your password'
        register={register}
        error={errors.password}
      />
      <Textinput
        name='confirmpassword'
        label='Confirm Password'
        type='password'
        placeholder='Confirm your password'
        register={register}
        error={errors.confirmpassword}
      />
      <Dropdowntype
        label={userType}
        items={[
          { label: 'Startup', value: 'startup' },
          { label: 'Investor', value: 'investor' },
        ]}
        onSelect={handleSelectUserType}
        error={errors.user_type}
      />
      <button
        className='btn btn-dark block w-full text-center'
        type='submit'
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Create an account'}
      </button>
    </form>
  );
};

export default RegForm;

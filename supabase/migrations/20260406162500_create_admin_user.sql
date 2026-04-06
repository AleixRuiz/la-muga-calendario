DO $block$
DECLARE
  new_uid uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
    recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  )
  VALUES (
    new_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@admin.es', 
    extensions.crypt('Lamuga2026@', extensions.gen_salt('bf')), now(), now(), now(), 
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
  );

  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    gen_random_uuid(), new_uid, new_uid::text, format('{"sub":"%s","email":"%s"}', new_uid::text, 'admin@admin.es')::jsonb,
    'email', now(), now(), now()
  );

  INSERT INTO public.employees (id, role, email, first_name, last_name)
  VALUES (new_uid, 'admin', 'admin@admin.es', 'Admin', 'Sistema');

END $block$;

-- Sample data for development and demos: 10 machines, alarms and maintenance records.
--
-- Run it in the Supabase SQL Editor after all migrations have been applied.
-- Create at least one user first (Authentication > Users): profiles come from a
-- trigger and this file never inserts into auth.users or profiles.
--
-- Safe to run again: if the sample machines already exist it does nothing.
-- It runs as one transaction, so a failure leaves the database unchanged.
--
-- The SQL Editor has no signed-in user, so the alarm triggers do not run.
-- Closed alarms therefore set closed_by, closed_at, cause and action_taken here.
-- Machine status counts: Running 6, Stop 2, Alarm 1, Maintenance 1.

do $$
declare
  v_technicians uuid[];
  v_admin uuid;
begin
  if exists (
    select 1
    from public.machines
    where machine_code in (
      'CNC-001', 'CNC-002', 'INJ-001', 'INJ-002', 'CNV-001',
      'ROB-001', 'CMP-001', 'PRS-001', 'ROB-002', 'PMP-001'
    )
  ) then
    raise notice 'Sample data is already loaded, nothing to do.';
    return;
  end if;

  -- Technicians own the maintenance records. If nobody has the technician
  -- role yet, fall back to every profile so the seed still works with one admin.
  select array_agg(id order by created_at)
    into v_technicians
    from public.profiles
    where role = 'technician';

  if v_technicians is null then
    select array_agg(id order by created_at)
      into v_technicians
      from public.profiles;
  end if;

  if v_technicians is null then
    raise exception
      'No users found. Create at least one user in Authentication > Users, then run this seed again.';
  end if;

  select id
    into v_admin
    from public.profiles
    where role = 'admin'
    order by created_at
    limit 1;

  -- Machines -----------------------------------------------------------------
  insert into public.machines (machine_code, name, type, location, status)
  values
    ('CNC-001', 'CNC Lathe 1',         'CNC Lathe',         'Line A',       'Running'),
    ('CNC-002', 'CNC Milling 1',       'CNC Milling',       'Line A',       'Running'),
    ('INJ-001', 'Injection Molder 1',  'Injection Molding', 'Line B',       'Running'),
    ('INJ-002', 'Injection Molder 2',  'Injection Molding', 'Line B',       'Alarm'),
    ('CNV-001', 'Conveyor Belt 1',     'Conveyor',          'Line C',       'Running'),
    ('ROB-001', 'Packing Robot 1',     'Robot',             'Line C',       'Running'),
    ('CMP-001', 'Air Compressor 1',    'Compressor',        'Utility Room', 'Stop'),
    ('PRS-001', 'Hydraulic Press 1',   'Press',             'Line D',       'Maintenance'),
    ('ROB-002', 'Welding Robot 1',     'Robot',             'Line D',       'Running'),
    ('PMP-001', 'Cooling Pump 1',      'Pump',              'Utility Room', 'Stop');

  -- Alarms -------------------------------------------------------------------
  -- 9 alarms: 3 Open, 2 In Progress, 4 Closed. Times are relative to now(), and
  -- occurred_at must never be in the future.
  insert into public.alarms (
    machine_id, alarm_code, description, occurred_at,
    cause, action_taken, status, created_by, closed_by, closed_at
  )
  select
    m.id,
    v.alarm_code,
    v.description,
    v.occurred_at,
    v.cause,
    v.action_taken,
    v.status::public.alarm_status,
    v_admin,
    case when v.status = 'Closed' then v_admin end,
    case when v.status = 'Closed' then v.occurred_at + v.closed_after end
  from (
    values
      ('INJ-002', 'E-101', 'Injection pressure too high',
        now() - interval '2 hours', null, null, 'Open', null::interval),
      ('CMP-001', 'E-410', 'Low oil pressure',
        now() - interval '1 day', null, null, 'Open', null),
      ('PMP-001', 'P-601', 'Motor overheating',
        now() - interval '3 hours', null, null, 'Open', null),
      ('CNC-001', 'E-310', 'Spindle overload',
        now() - interval '5 hours', 'Tool wear suspected', null, 'In Progress', null),
      ('PRS-001', 'H-501', 'Hydraulic oil leak',
        now() - interval '1 day 4 hours', 'Hose fitting loose', null, 'In Progress', null),
      ('INJ-002', 'E-205', 'Heater band temperature low',
        now() - interval '3 days', 'Heater band worn out',
        'Replaced the heater band', 'Closed', interval '4 hours'),
      ('CNV-001', 'E-120', 'Belt slip detected',
        now() - interval '6 days', 'Belt tension too low',
        'Adjusted the belt tension', 'Closed', interval '2 hours'),
      ('ROB-001', 'E-330', 'Gripper sensor fault',
        now() - interval '10 days', 'Sensor cable damaged',
        'Replaced the sensor cable', 'Closed', interval '1 day'),
      ('CNC-002', 'E-315', 'Coolant level low',
        now() - interval '2 days', 'Coolant not refilled',
        'Refilled the coolant tank', 'Closed', interval '1 hour')
  ) as v (
    machine_code, alarm_code, description, occurred_at,
    cause, action_taken, status, closed_after
  )
  join public.machines m on m.machine_code = v.machine_code;

  -- Maintenance records ------------------------------------------------------
  -- 8 records: 4 Completed, 2 In Progress, 2 Pending. Some link the alarm that
  -- caused the work (the alarm always belongs to the same machine).
  -- Technicians are assigned in turn from the users that exist.
  insert into public.maintenance_records (
    machine_id, alarm_id, technician_id, type, problem, action_taken,
    status, start_date, end_date, created_by
  )
  select
    m.id,
    a.id,
    v_technicians[1 + (v.n % array_length(v_technicians, 1))],
    v.type::public.maintenance_type,
    v.problem,
    v.action_taken,
    v.status::public.maintenance_status,
    v.start_date,
    v.end_date,
    v_technicians[1 + (v.n % array_length(v_technicians, 1))]
  from (
    values
      (0, 'PRS-001', 'H-501', 'Corrective',
        'Hydraulic oil leaking at the main cylinder hose',
        'Tightened the hose fitting, leak test still pending',
        'In Progress', current_date - 1, null::date),
      (1, 'INJ-002', 'E-205', 'Corrective',
        'Heater band temperature low on zone 2',
        'Replaced the heater band and checked the temperature control',
        'Completed', current_date - 3, current_date - 3),
      (2, 'CNC-001', 'E-310', 'Corrective',
        'Spindle overload alarm during roughing cycle',
        null,
        'In Progress', current_date, null),
      (3, 'CNV-001', 'E-120', 'Corrective',
        'Belt slipping under load',
        'Adjusted the belt tension and tested with a full load',
        'Completed', current_date - 6, current_date - 6),
      (4, 'CNC-002', null, 'Preventive',
        'Monthly lubrication and coolant filter check',
        'Lubricated the guideways and replaced the coolant filter',
        'Completed', current_date - 14, current_date - 14),
      (5, 'CMP-001', null, 'Preventive',
        'Quarterly air filter and oil change',
        null,
        'Pending', current_date + 3, null),
      (6, 'ROB-001', 'E-330', 'Corrective',
        'Gripper sensor fault stops the packing cycle',
        'Replaced the sensor cable and tested the gripper',
        'Completed', current_date - 10, current_date - 9),
      (7, 'PMP-001', 'P-601', 'Corrective',
        'Cooling pump motor overheating',
        null,
        'Pending', current_date, null)
  ) as v (
    n, machine_code, alarm_code, type, problem, action_taken,
    status, start_date, end_date
  )
  join public.machines m on m.machine_code = v.machine_code
  left join public.alarms a
    on a.machine_id = m.id and a.alarm_code = v.alarm_code;
end
$$;

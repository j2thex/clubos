-- Mark one membership period per club as the default for new members.
-- The staff create-member form pre-selects this period so admins don't
-- have to explain the dropdown to each staff user.

alter table membership_periods
  add column is_default boolean not null default false;

-- At most one default per club.
create unique index membership_periods_club_default_uniq
  on membership_periods (club_id)
  where is_default = true;

-- Backfill: the active period with the lowest display_order per club
-- becomes the default. Ties broken by earliest created_at.
with ranked as (
  select id,
         row_number() over (
           partition by club_id
           order by display_order asc, created_at asc
         ) as rn
    from membership_periods
   where active = true
)
update membership_periods m
   set is_default = true
  from ranked r
 where m.id = r.id
   and r.rn = 1;

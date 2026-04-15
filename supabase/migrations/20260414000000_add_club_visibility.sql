-- Club visibility levels: public (discoverable), unlisted (hidden from discover but direct link works), private (fully hidden, owner onboards manually)
create type club_visibility as enum ('public', 'unlisted', 'private');

alter table clubs
  add column visibility club_visibility not null default 'public',
  add column requested_visibility club_visibility not null default 'public';
